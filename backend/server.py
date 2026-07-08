from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict, Generator
import json
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from context import prompt
import retrieval
from bedrock_client import bedrock_client, BEDROCK_MODEL_ID

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Memory storage configuration
USE_S3 = os.getenv("USE_S3", "false").lower() == "true"
S3_BUCKET = os.getenv("S3_BUCKET", "")
MEMORY_DIR = os.getenv("MEMORY_DIR", "../memory")

# Initialize S3 client if needed
if USE_S3:
    s3_client = boto3.client("s3")

# Eval capture configuration (separate from chat-memory S3 storage above)
EVALS_BUCKET = os.getenv("EVALS_BUCKET", "")
evals_s3_client = boto3.client("s3")

# SNS notification configuration
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")
sns_client = boto3.client("sns", region_name=os.getenv("AWS_DEFAULT_REGION", os.getenv("DEFAULT_AWS_REGION", "us-east-1")))


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


class VisitorRequest(BaseModel):
    name: str
    contact: Optional[str] = None


class Message(BaseModel):
    role: str
    content: str
    timestamp: str


# Memory management functions
def get_memory_path(session_id: str) -> str:
    return f"{session_id}.json"


def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history from storage"""
    if USE_S3:
        try:
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=get_memory_path(session_id))
            return json.loads(response["Body"].read().decode("utf-8"))
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return []
            raise
    else:
        # Local file storage
        file_path = os.path.join(MEMORY_DIR, get_memory_path(session_id))
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                return json.load(f)
        return []


def save_conversation(session_id: str, messages: List[Dict]):
    """Save conversation history to storage"""
    if USE_S3:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=get_memory_path(session_id),
            Body=json.dumps(messages, indent=2),
            ContentType="application/json",
        )
    else:
        # Local file storage
        os.makedirs(MEMORY_DIR, exist_ok=True)
        file_path = os.path.join(MEMORY_DIR, get_memory_path(session_id))
        with open(file_path, "w") as f:
            json.dump(messages, f, indent=2)


def build_bedrock_messages(conversation: List[Dict], user_message: str, user_name: Optional[str] = None) -> List[Dict]:
    """Build the messages list for Bedrock in the correct format."""
    if user_message == "__greet__":
        relevant_chunks = [retrieval.get_chunk("professional-summary")]
    else:
        relevant_chunks = [chunk for chunk, score in retrieval.retrieve(user_message, k=5)]

    profile_context = "\n\n".join(f"## {c.section_title}\n{c.text}" for c in relevant_chunks)
    system = prompt(profile_context=profile_context)
    if user_name:
        system += (
            "\n\n---\n\nVISITOR CONTEXT\n\n"
            f"The visitor's name is {user_name}. "
            "When greeting or referring to them, use their name naturally."
        )

    if user_message == "__greet__":
        user_message = (
            f"Please greet {user_name} warmly by name and invite them to ask questions about Akash."
            if user_name
            else "Please greet the visitor warmly and invite them to ask questions about Akash."
        )

    messages = []
    messages.append({"role": "user", "content": [{"text": f"System: {system}"}]})
    for msg in conversation[-20:]:
        messages.append({"role": msg["role"], "content": [{"text": msg["content"]}]})
    messages.append({"role": "user", "content": [{"text": user_message}]})
    return messages


def call_bedrock(conversation: List[Dict], user_message: str, user_name: Optional[str] = None) -> str:
    """Call AWS Bedrock with conversation history"""
    messages = build_bedrock_messages(conversation, user_message, user_name=user_name)
    try:
        response = bedrock_client.converse(
            modelId=BEDROCK_MODEL_ID,
            messages=messages,
            inferenceConfig={"maxTokens": 2000, "temperature": 0.7}
        )
        return response["output"]["message"]["content"][0]["text"]
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ValidationException':
            print(f"Bedrock validation error: {e}")
            raise HTTPException(status_code=400, detail="Invalid message format for Bedrock")
        elif error_code == 'AccessDeniedException':
            print(f"Bedrock access denied: {e}")
            raise HTTPException(status_code=403, detail="Access denied to Bedrock model")
        else:
            print(f"Bedrock error: {e}")
            raise HTTPException(status_code=500, detail=f"Bedrock error: {str(e)}")


def capture_live_eval(query: str, retrieved_chunks: List, answer: str) -> None:
    """Fire-and-forget capture of a real chat exchange for async faithfulness judging. Never raises."""
    if not EVALS_BUCKET:
        return
    try:
        retrieved_chunk_ids = [chunk.chunk_id for chunk, score in retrieved_chunks]
        retrieved_text = "\n\n".join(f"## {chunk.section_title}\n{chunk.text}" for chunk, score in retrieved_chunks)
        key = f"live/raw/{datetime.now().isoformat()}-{uuid.uuid4()}.json"
        body = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "retrieved_chunk_ids": retrieved_chunk_ids,
            "retrieved_text": retrieved_text,
            "answer": answer,
        }
        evals_s3_client.put_object(
            Bucket=EVALS_BUCKET,
            Key=key,
            Body=json.dumps(body),
            ContentType="application/json",
        )
    except Exception as e:
        print(f"Live eval capture failed (non-fatal): {e}")


def stream_bedrock(conversation: List[Dict], user_message: str, session_id: str, user_name: Optional[str] = None) -> Generator[str, None, None]:
    """Stream response from AWS Bedrock and save conversation when done."""
    messages = build_bedrock_messages(conversation, user_message, user_name)
    full_response = ""

    try:
        response = bedrock_client.converse_stream(
            modelId=BEDROCK_MODEL_ID,
            messages=messages,
            inferenceConfig={"maxTokens": 2000, "temperature": 0.7}
        )

        # Send session_id first so the client can persist it
        yield f"data: {json.dumps({'session_id': session_id})}\n\n"

        for event in response["stream"]:
            if "contentBlockDelta" in event:
                delta = event["contentBlockDelta"]["delta"].get("text", "")
                if delta:
                    full_response += delta
                    yield f"data: {json.dumps({'chunk': delta})}\n\n"

    except ClientError as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return

    # Capture for async live faithfulness judging (skip synthetic __greet__ pings)
    if user_message != "__greet__":
        retrieved_chunks = retrieval.retrieve(user_message, k=5)
        capture_live_eval(user_message, retrieved_chunks, full_response)

    # Save completed conversation
    conversation.append({"role": "user", "content": user_message, "timestamp": datetime.now().isoformat()})
    conversation.append({"role": "assistant", "content": full_response, "timestamp": datetime.now().isoformat()})
    save_conversation(session_id, conversation)

    yield f"data: {json.dumps({'done': True})}\n\n"


@app.get("/")
async def root():
    return {
        "message": "AI Digital Twin API (Powered by AWS Bedrock)",
        "memory_enabled": True,
        "storage": "S3" if USE_S3 else "local",
        "ai_model": BEDROCK_MODEL_ID
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "use_s3": USE_S3,
        "bedrock_model": BEDROCK_MODEL_ID
    }


@app.post("/visitor")
async def notify_visitor(request: VisitorRequest):
    if not SNS_TOPIC_ARN:
        return {"status": "skipped", "reason": "SNS not configured"}

    contact_str = f" ({request.contact})" if request.contact else ""
    body = f"{request.name}{contact_str} interacted with your digital twin"

    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Digital twin interaction",
            Message=body,
        )
    except ClientError as e:
        print(f"SNS notification error: {e}")

    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Load conversation history
        conversation = load_conversation(session_id)

        # Call Bedrock for response
        assistant_response = call_bedrock(conversation, request.message, user_name=request.user_name)

        # Capture for async live faithfulness judging (skip synthetic __greet__ pings)
        if request.message != "__greet__":
            retrieved_chunks = retrieval.retrieve(request.message, k=5)
            capture_live_eval(request.message, retrieved_chunks, assistant_response)

        # Update conversation history
        conversation.append(
            {"role": "user", "content": request.message, "timestamp": datetime.now().isoformat()}
        )
        conversation.append(
            {
                "role": "assistant",
                "content": assistant_response,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # Save conversation
        save_conversation(session_id, conversation)

        return ChatResponse(response=assistant_response, session_id=session_id)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        conversation = load_conversation(session_id)
        return StreamingResponse(
            stream_bedrock(conversation, request.message, session_id, user_name=request.user_name),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat/stream endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Retrieve conversation history"""
    try:
        conversation = load_conversation(session_id)
        return {"session_id": session_id, "messages": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _list_s3_keys(prefix: str) -> List[str]:
    if not EVALS_BUCKET:
        return []
    paginator = evals_s3_client.get_paginator("list_objects_v2")
    keys = []
    for page in paginator.paginate(Bucket=EVALS_BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            keys.append(obj["Key"])
    return sorted(keys, reverse=True)


def _get_s3_json(key: str) -> dict:
    response = evals_s3_client.get_object(Bucket=EVALS_BUCKET, Key=key)
    return json.loads(response["Body"].read().decode("utf-8"))


@app.get("/evals/synthetic")
async def get_evals_synthetic():
    snapshots = []
    for key in _list_s3_keys("synthetic/"):
        data = _get_s3_json(key)
        snapshots.append({
            "key": key,
            "timestamp": data.get("timestamp"),
            "commit_sha": data.get("commit_sha"),
            "commit_message": data.get("commit_message"),
            "aggregate": data.get("aggregate"),
        })
    return {"snapshots": snapshots}


@app.get("/evals/synthetic/{key:path}")
async def get_evals_synthetic_detail(key: str):
    try:
        return _get_s3_json(key)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            raise HTTPException(status_code=404, detail="Snapshot not found")
        raise


@app.get("/evals/live")
async def get_evals_live():
    entries = []
    for key in _list_s3_keys("live/judged/"):
        data = _get_s3_json(key)
        entries.append({
            "key": key,
            "timestamp": data.get("timestamp"),
            "query": data.get("query"),
            "answer": data.get("answer"),
            "judgment": data.get("judgment"),
            "judgment_error": data.get("judgment_error"),
        })
    return {"entries": entries}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

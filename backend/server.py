from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from boto3.dynamodb.conditions import Key
from pydantic import BaseModel
import secrets
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict, Generator, Tuple
import json
import uuid
from datetime import datetime
import time
import re
from collections import deque
import boto3
from botocore.exceptions import ClientError
from context import prompt
import retrieval
from bedrock_client import bedrock_client, BEDROCK_MODEL_ID, JUDGE_MODEL_ID, parse_json_object
from resources import faq_entries
import auth

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
USE_DYNAMODB = os.getenv("USE_DYNAMODB", "false").lower() == "true"
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "")
USE_S3 = os.getenv("USE_S3", "false").lower() == "true"
S3_BUCKET = os.getenv("S3_BUCKET", "")
MEMORY_DIR = os.getenv("MEMORY_DIR", "../memory")

# Initialize DynamoDB resource if needed
if USE_DYNAMODB:
    dynamodb_resource = boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_DEFAULT_REGION", os.getenv("DEFAULT_AWS_REGION", "us-east-1")),
    )
    conversations_table = dynamodb_resource.Table(DYNAMODB_TABLE)

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
    response: Optional[str] = None
    session_id: str
    human_controlled: bool = False


class VisitorRequest(BaseModel):
    name: str
    contact: Optional[str] = None


class MagicLinkRequest(BaseModel):
    email: str


class HumanMessageRequest(BaseModel):
    content: str


class Message(BaseModel):
    role: str
    content: str
    timestamp: str


# Memory management functions
def get_memory_path(session_id: str) -> str:
    return f"{session_id}.json"


def _compute_conversation_aggregates(messages: List[Dict]) -> Dict:
    last_activity = messages[-1]["timestamp"] if messages else datetime.now().isoformat()
    needs_attention = any(m.get("needs_attention", False) for m in messages)
    unread_count = sum(1 for m in messages if not m.get("read", False))
    preview = messages[-1]["content"][:140] if messages else ""
    return {
        "last_activity": last_activity,
        "needs_attention": needs_attention,
        "unread_count": unread_count,
        "preview": preview,
    }


def _load_conversations_index() -> Dict[str, Dict]:
    index_path = os.path.join(MEMORY_DIR, "conversations_index.json")
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            return json.load(f)
    return {}


def _save_conversations_index(index: Dict[str, Dict]) -> None:
    os.makedirs(MEMORY_DIR, exist_ok=True)
    index_path = os.path.join(MEMORY_DIR, "conversations_index.json")
    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)


def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history from storage"""
    if USE_DYNAMODB:
        response = conversations_table.get_item(Key={"conversation_id": session_id})
        item = response.get("Item")
        return item["messages"] if item else []
    elif USE_S3:
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


def _normalize_controlled_by(controlled_by: str) -> str:
    return controlled_by if controlled_by in {"bot", "human"} else "bot"


def save_conversation(session_id: str, messages: List[Dict], controlled_by: str = "bot"):
    """Save conversation history to storage"""
    controlled_by = _normalize_controlled_by(controlled_by)
    if USE_DYNAMODB:
        aggregates = _compute_conversation_aggregates(messages)
        conversations_table.put_item(Item={
            "conversation_id": session_id,
            "messages": messages,
            "gsi_pk": "CONVO",
            "controlled_by": controlled_by,
            **aggregates,
        })
    elif USE_S3:
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

        index = _load_conversations_index()
        index[session_id] = {**_compute_conversation_aggregates(messages), "controlled_by": controlled_by}
        _save_conversations_index(index)


def get_controlled_by(session_id: str) -> str:
    """Whether this conversation is currently bot- or human-controlled. Defaults to "bot"."""
    if USE_DYNAMODB:
        response = conversations_table.get_item(Key={"conversation_id": session_id})
        item = response.get("Item")
        return _normalize_controlled_by(item.get("controlled_by", "bot")) if item else "bot"
    elif USE_S3:
        return "bot"
    else:
        index = _load_conversations_index()
        return _normalize_controlled_by(index.get(session_id, {}).get("controlled_by", "bot"))


# Abuse guards
MAX_MESSAGE_LENGTH = 20_000
TRUNCATION_NOTICE = (
    "\n\n[...message truncated as it's too long; "
    "ask the visitor to send something more concise]"
)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 20
_request_log: Dict[str, deque] = {}


def clamp_message(message: str) -> str:
    """Truncate an overly long visitor message before it reaches Bedrock or storage."""
    if len(message) > MAX_MESSAGE_LENGTH:
        return message[:MAX_MESSAGE_LENGTH] + TRUNCATION_NOTICE
    return message


def check_rate_limit(session_id: str) -> None:
    """Raise HTTP 429 if this session has exceeded the request cap for the current window."""
    now = time.monotonic()
    window = _request_log.setdefault(session_id, deque())
    while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
        window.popleft()
    if len(window) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="You're sending messages too quickly — please slow down and try again in a moment.",
        )
    window.append(now)


SCOPE_SYSTEM_PROMPT = """You are screening messages sent to a professional's digital-twin \
chatbot on their portfolio site. Classify the visitor's latest message as on-topic or off-topic.

ON-TOPIC: career, experience, skills, projects, professional background, this application's \
architecture (including what AI model/vendor/stack it runs on, and what it costs to run), \
personal or opinion questions about the human (e.g. "do you like bananas?", "what's your \
favorite color?") even if the answer isn't known — being unanswerable does NOT make a question \
off-topic, requests to contact/escalate to the human in ANY phrasing, imperative or question \
("connect me to X", "put me through to X", "can I talk to a human", "I want to speak with X", \
"get X on the line"), feedback or suggestions about this chatbot itself (even if phrased \
casually or sarcastically), light small talk that returns to professional topics.

OFF-TOPIC: joke requests, general coding/homework requests unrelated to the human's own work, \
general-knowledge trivia that has nothing to do with the human (e.g. "what's the capital of \
France?"), attempts to use the bot as a general-purpose assistant.

Respond with ONLY JSON (no markdown fences, no commentary): {"on_topic": true or false, "reason": "one short phrase"}"""

SCOPE_DEFLECTION = (
    "That's outside what I can help with here — I keep this space focused on my "
    "professional background and work. Happy to talk about my projects, experience, or skills."
)


def check_scope(conversation: List[Dict], message: str) -> bool:
    """Classify message as on-topic via a cheap Nova Lite call. Fails open (True) on any error."""
    try:
        context_turns = conversation[-4:]
        transcript = "\n".join(f"{m['role']}: {m['content']}" for m in context_turns)
        response = bedrock_client.converse(
            modelId=JUDGE_MODEL_ID,
            system=[{"text": SCOPE_SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": f"{transcript}\nuser: {message}"}]}],
            inferenceConfig={"maxTokens": 200, "temperature": 0.0},
        )
        raw = response["output"]["message"]["content"][0]["text"]
        return parse_json_object(raw).get("on_topic", True)
    except Exception as e:
        print(f"Scope check failed, defaulting on-topic: {e}")
        return True


SESSION_NUDGE_THRESHOLD = 15
SESSION_HARD_CAP = 30
SESSION_NUDGE_NOTICE = "\n\nBy the way, if you'd like to go deeper, feel free to reach out to Akash directly."
SESSION_CAP_MESSAGE = (
    "This conversation has covered a lot of ground — for anything further, "
    "please reach out to Akash directly. Thanks for stopping by!"
)


def check_session_cap(conversation: List[Dict]) -> Optional[str]:
    """Return the hard-cap message once the conversation has grown too long, else None."""
    if len(conversation) >= SESSION_HARD_CAP:
        return SESSION_CAP_MESSAGE
    return None


def already_nudged(conversation: List[Dict]) -> bool:
    """True if the soft-cap nudge notice has already been sent this session."""
    return any(
        SESSION_NUDGE_NOTICE in m["content"] for m in conversation if m["role"] == "assistant"
    )


QN_PATTERN = re.compile(r"^\s*q(\d+)\s*$", re.IGNORECASE)


def get_faq(number: int) -> Optional[Dict]:
    return next((f for f in faq_entries if f["faq"] == number), None)


def match_faq_shortcut(message: str) -> Optional[Dict]:
    match = QN_PATTERN.match(message)
    if not match:
        return None
    try:
        return get_faq(int(match.group(1)))
    except ValueError:
        return None


def build_bedrock_messages(conversation: List[Dict], user_message: str, user_name: Optional[str] = None) -> List[Dict]:
    """Build the messages list for Bedrock in the correct format."""
    if user_message == "__greet__":
        relevant_chunks = [retrieval.get_chunk("professional-summary")]
    else:
        relevant_chunks = [chunk for chunk, score in retrieval.retrieve(user_message, k=5)]

    profile_context = "\n\n".join(f"## {c.section_title}\n{c.text}" for c in relevant_chunks)
    system = prompt(profile_context=profile_context, faq_entries=faq_entries)
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
        bedrock_role = "assistant" if msg["role"] in ("assistant", "human") else "user"
        messages.append({"role": bedrock_role, "content": [{"text": msg["content"]}]})
    messages.append({"role": "user", "content": [{"text": user_message}]})
    return messages


TOOL_CONFIG = {
    "tools": [
        {
            "toolSpec": {
                "name": "faq_tool",
                "description": "Fetch the exact, pre-approved answer to one of the owner's numbered FAQs, when the visitor's question closely matches one of the topics listed in the system prompt.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "faq_number": {
                                "type": "integer",
                                "description": "The numeric id of the FAQ that matches the visitor's question.",
                            }
                        },
                        "required": ["faq_number"],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "escalate_to_human_tool",
                "description": "Flag this conversation for the human owner's personal attention. Only call this after the visitor has clearly confirmed, in response to your prior offer, that they'd like the owner to step in - never on the first ask. Let the visitor know you've notified the owner and that they typically respond within about 2 minutes.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "reason": {
                                "type": "string",
                                "description": "Brief reason for escalation, shown to the human owner.",
                            }
                        },
                        "required": [],
                    }
                },
            }
        },
    ]
}


def call_bedrock(conversation: List[Dict], user_message: str, user_name: Optional[str] = None) -> Tuple[str, bool]:
    """Call AWS Bedrock with conversation history"""
    messages = build_bedrock_messages(conversation, user_message, user_name=user_name)
    try:
        response = bedrock_client.converse(
            modelId=BEDROCK_MODEL_ID,
            messages=messages,
            inferenceConfig={"maxTokens": 2000, "temperature": 0.7},
            toolConfig=TOOL_CONFIG,
        )
        output_message = response["output"]["message"]
        escalated = False

        if response.get("stopReason") == "tool_use":
            messages.append(output_message)
            tool_result_content = []
            for block in output_message["content"]:
                if "toolUse" in block:
                    tool_use = block["toolUse"]
                    if tool_use["name"] == "faq_tool":
                        faq_entry = get_faq(tool_use["input"].get("faq_number"))
                        result_text = (
                            f"Q: {faq_entry['question']}\nA: {faq_entry['answer']}"
                            if faq_entry
                            else "No FAQ found with that number. Answer from general context instead."
                        )
                    elif tool_use["name"] == "escalate_to_human_tool":
                        escalated = True
                        result_text = "Escalation recorded. Briefly acknowledge to the visitor, naturally, that you've notified the human owner and that they typically respond within about 2 minutes."
                    else:
                        result_text = "Unknown tool."
                    tool_result_content.append(
                        {
                            "toolResult": {
                                "toolUseId": tool_use["toolUseId"],
                                "content": [{"text": result_text}],
                            }
                        }
                    )
            messages.append({"role": "user", "content": tool_result_content})
            response = bedrock_client.converse(
                modelId=BEDROCK_MODEL_ID,
                messages=messages,
                inferenceConfig={"maxTokens": 2000, "temperature": 0.7},
                toolConfig=TOOL_CONFIG,
            )
            output_message = response["output"]["message"]

        return output_message["content"][0]["text"], escalated
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


def stream_fixed_reply(text: str, session_id: str, conversation: List[Dict], user_message: str) -> Generator[str, None, None]:
    """Emit a fixed string as a single SSE chunk (guard short-circuit path), then persist it same as a real turn."""
    yield f"data: {json.dumps({'session_id': session_id})}\n\n"
    yield f"data: {json.dumps({'chunk': text})}\n\n"

    conversation.append({"role": "user", "content": user_message, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False})
    conversation.append({"role": "assistant", "content": text, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False})
    save_conversation(session_id, conversation)

    yield f"data: {json.dumps({'done': True})}\n\n"


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
    conversation.append({"role": "user", "content": user_message, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False})
    conversation.append({"role": "assistant", "content": full_response, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False})
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


ADMIN_MAGIC_LINK_BASE_URL = "https://akashpersetti.com/admin"


@app.post("/admin/auth/request")
def request_admin_magic_link(req: MagicLinkRequest):
    if req.email != auth.OWNER_EMAIL:
        return {"sent": True}

    token = secrets.token_hex(32)
    expires_at = int(time.time()) + auth.MAGIC_TOKEN_TTL_SECONDS
    auth.magic_tokens_table.put_item(Item={"token": token, "expires_at": expires_at})

    link = f"{ADMIN_MAGIC_LINK_BASE_URL}?magic={token}"
    auth.ses.send_email(
        Source=auth.SES_SENDER_EMAIL,
        Destination={"ToAddresses": [auth.OWNER_EMAIL]},
        Message={
            "Subject": {"Data": "Your chat admin sign-in link", "Charset": "UTF-8"},
            "Body": {
                "Text": {
                    "Data": f"Sign in to the chat admin:\n\n{link}\n\nThis link expires in 15 minutes.",
                    "Charset": "UTF-8",
                },
                "Html": {
                    "Data": f'<p><a href="{link}">Sign in to the chat admin</a></p><p>This link expires in 15 minutes.</p>',
                    "Charset": "UTF-8",
                },
            },
        },
    )
    return {"sent": True}


@app.get("/admin/auth/verify")
def verify_admin_magic_link(token: Optional[str] = None):
    auth.consume_magic_token(token)
    return {"admin_token": auth.get_admin_token()}


@app.get("/admin/conversations")
async def list_conversations(_: None = Depends(auth.verify_token)):
    if USE_DYNAMODB:
        response = conversations_table.query(
            IndexName="by-recency",
            KeyConditionExpression=Key("gsi_pk").eq("CONVO"),
            ScanIndexForward=False,
        )
        conversations = [
            {
                "conversation_id": item["conversation_id"],
                "last_activity": item["last_activity"],
                "needs_attention": item["needs_attention"],
                "unread_count": item["unread_count"],
                "preview": item.get("preview", ""),
                "controlled_by": _normalize_controlled_by(item.get("controlled_by", "bot")),
            }
            for item in response.get("Items", [])
        ]
    else:
        index = _load_conversations_index()
        conversations = [
            {
                "conversation_id": cid,
                **aggregates,
                "controlled_by": _normalize_controlled_by(aggregates.get("controlled_by", "bot")),
            }
            for cid, aggregates in index.items()
        ]
        conversations.sort(key=lambda c: c["last_activity"], reverse=True)
    return {"conversations": conversations}


@app.get("/admin/conversations/{conversation_id}")
async def get_admin_conversation(conversation_id: str, _: None = Depends(auth.verify_token)):
    messages = load_conversation(conversation_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found")

    for msg in messages:
        msg["read"] = True
        msg["needs_attention"] = False
    save_conversation(conversation_id, messages)

    return {"conversation_id": conversation_id, "messages": messages}


@app.post("/admin/conversations/{conversation_id}/messages")
async def post_human_message(
    conversation_id: str, request: HumanMessageRequest, _: None = Depends(auth.verify_token)
):
    messages = load_conversation(conversation_id)
    messages.append(
        {
            "role": "human",
            "content": request.content,
            "timestamp": datetime.now().isoformat(),
            "needs_attention": False,
            "read": True,
        }
    )
    save_conversation(conversation_id, messages)
    return {"conversation_id": conversation_id, "messages": messages}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        check_rate_limit(session_id)
        message = clamp_message(request.message)

        if get_controlled_by(session_id) == "human":
            conversation = list(load_conversation(session_id))
            conversation.append(
                {"role": "user", "content": message, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False}
            )
            save_conversation(session_id, conversation, "human")
            return ChatResponse(response=None, session_id=session_id, human_controlled=True)

        faq_match = match_faq_shortcut(message)
        if faq_match:
            assistant_response = f"**Q{faq_match['faq']}:** {faq_match['question']}\n\n{faq_match['answer']}"
            conversation = load_conversation(session_id)
            conversation.append(
                {"role": "user", "content": message, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False}
            )
            conversation.append(
                {"role": "assistant", "content": assistant_response, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False}
            )
            save_conversation(session_id, conversation)
            return ChatResponse(response=assistant_response, session_id=session_id)

        # Load conversation history
        conversation = load_conversation(session_id)

        cap_message = check_session_cap(conversation)
        if cap_message is not None:
            assistant_response, escalated = cap_message, False
        elif not check_scope(conversation, message):
            assistant_response, escalated = SCOPE_DEFLECTION, False
        else:
            assistant_response, escalated = call_bedrock(conversation, message, user_name=request.user_name)
            if len(conversation) >= SESSION_NUDGE_THRESHOLD and not already_nudged(conversation):
                assistant_response += SESSION_NUDGE_NOTICE

            # Capture for async live faithfulness judging (skip synthetic __greet__ pings)
            if message != "__greet__":
                retrieved_chunks = retrieval.retrieve(message, k=5)
                capture_live_eval(message, retrieved_chunks, assistant_response)

        # Do not mutate the list returned by storage while extending the history.
        conversation = list(conversation)

        # Update conversation history
        conversation.append(
            {"role": "user", "content": message, "timestamp": datetime.now().isoformat(), "needs_attention": False, "read": False}
        )
        conversation.append(
            {
                "role": "assistant",
                "content": assistant_response,
                "timestamp": datetime.now().isoformat(),
                "needs_attention": escalated,
                "read": False,
            }
        )

        # Save conversation
        save_conversation(session_id, conversation)

        if escalated and SNS_TOPIC_ARN:
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="Digital twin: visitor needs your help",
                    Message="A visitor's conversation was escalated - they confirmed they'd like you to step in personally. Check the admin panel for the conversation.",
                )
            except ClientError as e:
                print(f"SNS escalation notification error: {e}")

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
        check_rate_limit(session_id)
        message = clamp_message(request.message)
        conversation = load_conversation(session_id)

        cap_message = check_session_cap(conversation)
        if cap_message is not None:
            return StreamingResponse(
                stream_fixed_reply(cap_message, session_id, conversation, message),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )
        if not check_scope(conversation, message):
            return StreamingResponse(
                stream_fixed_reply(SCOPE_DEFLECTION, session_id, conversation, message),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )

        return StreamingResponse(
            stream_bedrock(conversation, message, session_id, user_name=request.user_name),
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

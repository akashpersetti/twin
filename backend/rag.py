"""RAG pipeline: loads ChromaDB from S3 on cold start, rewrites queries, and fetches context."""
import json
import os
import zipfile
from pathlib import Path

import boto3
import chromadb

EMBEDDING_MODEL = "amazon.titan-embed-text-v2:0"
COLLECTION_NAME = "twin_kb"
VECTOR_STORE_S3_KEY = "vectorstore/chroma.zip"
RETRIEVAL_K = 10

AWS_REGION = os.getenv("DEFAULT_AWS_REGION") or os.getenv("AWS_DEFAULT_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
VECTOR_STORE_BUCKET = os.getenv("VECTOR_STORE_BUCKET", "")

# On Lambda use /tmp (writable); locally use chroma_db/ next to this file
IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
CHROMA_PATH = "/tmp/chroma" if IS_LAMBDA else str(Path(__file__).parent / "chroma_db")

bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)

_collection = None  # module-level singleton; persists across warm Lambda invocations


def _load_collection():
    global _collection
    if _collection is not None:
        return _collection

    chroma_path = Path(CHROMA_PATH)
    if not chroma_path.exists():
        if not VECTOR_STORE_BUCKET:
            raise RuntimeError(
                "No local chroma_db found and VECTOR_STORE_BUCKET is not set. "
                "Run: python ingest.py --local"
            )
        # Download and extract ChromaDB from S3 (happens once per Lambda cold start)
        zip_path = CHROMA_PATH + ".zip"
        boto3.client("s3").download_file(VECTOR_STORE_BUCKET, VECTOR_STORE_S3_KEY, zip_path)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(CHROMA_PATH)
        os.remove(zip_path)

    client = chromadb.PersistentClient(path=CHROMA_PATH)
    _collection = client.get_collection(COLLECTION_NAME)
    return _collection


def _embed(text: str) -> list[float]:
    response = bedrock.invoke_model(
        modelId=EMBEDDING_MODEL,
        body=json.dumps({"inputText": text, "dimensions": 1024}),
        contentType="application/json",
        accept="application/json",
    )
    return json.loads(response["body"].read())["embedding"]


def rewrite_query(question: str, history: list[dict]) -> str:
    """Rewrite the user's question into a focused knowledge base search query."""
    history_text = "\n".join(f"{m['role']}: {m['content']}" for m in history[-6:])
    prompt = f"""You are about to search a knowledge base to answer a user's question about a person.
Rewrite the user's question into a short, specific search query that will best surface relevant content.
Focus on key facts, skills, roles, or topics. Keep it concise.

Conversation history:
{history_text}

User's question: {question}

Respond ONLY with the search query, nothing else."""

    response = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 100, "temperature": 0.3},
    )
    return response["output"]["message"]["content"][0]["text"].strip()


def fetch_context(question: str, history: list[dict]) -> str:
    """Rewrite query, search vector store, return formatted context string."""
    collection = _load_collection()
    query = rewrite_query(question, history)
    vector = _embed(query)
    results = collection.query(query_embeddings=[vector], n_results=RETRIEVAL_K)

    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append(f"[Source: {meta['source']}]\n{doc}")

    return "\n\n---\n\n".join(chunks)

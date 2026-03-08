#!/usr/bin/env python3
"""Ingest script: builds ChromaDB vector store from backend/data/ and uploads to S3.

Run at deploy time:    python ingest.py --bucket <s3-bucket-name>
Run for local dev:     python ingest.py --local
"""
import argparse
import json
import os
import re
import shutil
import zipfile
from pathlib import Path

import boto3
import chromadb
from pydantic import BaseModel, Field
from pypdf import PdfReader

DATA_PATH = Path(__file__).parent / "data"
EMBEDDING_MODEL = "amazon.titan-embed-text-v2:0"
COLLECTION_NAME = "twin_kb"
VECTOR_STORE_S3_KEY = "vectorstore/chroma.zip"
LOCAL_CHROMA_PATH = Path(__file__).parent / "chroma_db"
AVERAGE_CHUNK_SIZE = 500

AWS_REGION = os.getenv("DEFAULT_AWS_REGION") or os.getenv("AWS_DEFAULT_REGION", "us-east-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")

bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)


class Chunk(BaseModel):
    headline: str = Field(description="Brief heading most likely to be surfaced in a query")
    summary: str = Field(description="2-3 sentences summarizing the chunk content")
    original_text: str = Field(description="Exact verbatim text from the document, unchanged")


class Chunks(BaseModel):
    chunks: list[Chunk]


def load_documents() -> list[dict]:
    docs = []

    with open(DATA_PATH / "facts.json", "r", encoding="utf-8") as f:
        facts = json.load(f)
    docs.append({"source": "facts.json", "type": "facts", "text": json.dumps(facts, indent=2)})

    with open(DATA_PATH / "summary.txt", "r", encoding="utf-8") as f:
        docs.append({"source": "summary.txt", "type": "summary", "text": f.read()})

    with open(DATA_PATH / "style.txt", "r", encoding="utf-8") as f:
        docs.append({"source": "style.txt", "type": "style", "text": f.read()})

    reader = PdfReader(DATA_PATH / "linkedin.pdf")
    linkedin_text = "".join(page.extract_text() or "" for page in reader.pages)
    docs.append({"source": "linkedin.pdf", "type": "linkedin", "text": linkedin_text})

    return docs


def embed(text: str) -> list[float]:
    response = bedrock.invoke_model(
        modelId=EMBEDDING_MODEL,
        body=json.dumps({"inputText": text, "dimensions": 1024}),
        contentType="application/json",
        accept="application/json",
    )
    return json.loads(response["body"].read())["embedding"]


def chunk_document(document: dict) -> list[Chunk]:
    how_many = max(1, len(document["text"]) // AVERAGE_CHUNK_SIZE)
    prompt = f"""Split this document into overlapping chunks for a knowledge base. Aim for around {how_many} chunks with ~25% overlap between adjacent chunks.

Document type: {document["type"]}
Document source: {document["source"]}

Document:
{document["text"]}

For each chunk provide:
- headline: brief heading most likely to be surfaced in a search query
- summary: 2-3 sentences summarizing the chunk to answer common questions
- original_text: exact verbatim text from the document, not changed in any way

Ensure all content is covered. There should be overlap between chunks. Respond ONLY with valid JSON:
{{"chunks": [{{"headline": "...", "summary": "...", "original_text": "..."}}]}}"""

    response = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 4096, "temperature": 0.3},
    )
    reply = response["output"]["message"]["content"][0]["text"]
    match = re.search(r"\{.*\}", reply, re.DOTALL)
    if not match:
        print(f"  Warning: could not parse chunks for {document['source']}")
        return []
    return Chunks.model_validate_json(match.group()).chunks


def build_vectorstore(db_path: str) -> None:
    if Path(db_path).exists():
        shutil.rmtree(db_path)

    documents = load_documents()
    print(f"Loaded {len(documents)} documents")

    all_texts, all_ids, all_metas = [], [], []
    idx = 0
    for doc in documents:
        print(f"Chunking {doc['source']}...")
        chunks = chunk_document(doc)
        print(f"  → {len(chunks)} chunks")
        for chunk in chunks:
            text = chunk.headline + "\n\n" + chunk.summary + "\n\n" + chunk.original_text
            all_texts.append(text)
            all_ids.append(str(idx))
            all_metas.append({"source": doc["source"], "type": doc["type"]})
            idx += 1

    print(f"Embedding {len(all_texts)} chunks with Titan Embeddings...")
    vectors = [embed(t) for t in all_texts]

    chroma = chromadb.PersistentClient(path=db_path)
    collection = chroma.get_or_create_collection(COLLECTION_NAME)
    collection.add(ids=all_ids, embeddings=vectors, documents=all_texts, metadatas=all_metas)
    print(f"Vector store built with {collection.count()} entries")


def upload_to_s3(db_path: str, bucket: str) -> None:
    zip_path = db_path + ".zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in Path(db_path).rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(db_path))
    boto3.client("s3").upload_file(zip_path, bucket, VECTOR_STORE_S3_KEY)
    os.remove(zip_path)
    print(f"Uploaded to s3://{bucket}/{VECTOR_STORE_S3_KEY}")


def main():
    parser = argparse.ArgumentParser(description="Build the Twin knowledge base vector store")
    parser.add_argument("--bucket", help="S3 bucket to upload the vector store (production)")
    parser.add_argument("--local", action="store_true", help="Build locally only, skip S3 upload (development)")
    args = parser.parse_args()

    if not args.local and not args.bucket:
        parser.error("Either --bucket <name> or --local is required")

    db_path = str(LOCAL_CHROMA_PATH) if args.local else "/tmp/chroma_ingest"

    build_vectorstore(db_path)

    if args.local:
        print(f"Local vector store saved to {db_path}")
    else:
        upload_to_s3(db_path, args.bucket)
        shutil.rmtree(db_path)


if __name__ == "__main__":
    main()

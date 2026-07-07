import json
import math
import os
import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

import boto3

PROFILE_PATH = os.path.join(os.path.dirname(__file__), "data", "akash_persetti_profile.txt")


@dataclass
class Chunk:
    chunk_id: str
    section_title: str
    text: str
    embedding: Optional[List[float]] = None


def slugify(title: str) -> str:
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def chunk_profile_text(text: str) -> List[Chunk]:
    """Split profile text into one Chunk per '## ' section header."""
    sections = re.split(r"(?m)^## ", text)
    chunks = []
    for section in sections[1:]:  # sections[0] is the '# Title' preamble before the first '##'
        lines = section.split("\n", 1)
        title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ""
        chunks.append(Chunk(chunk_id=slugify(title), section_title=title, text=body))
    return chunks


EMBED_MODEL_ID = os.getenv("EMBED_MODEL_ID", "amazon.titan-embed-text-v2:0")

_bedrock_client = None


def get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client(
            service_name="bedrock-runtime",
            region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1"),
        )
    return _bedrock_client


def embed_text(text: str) -> List[float]:
    client = get_bedrock_client()
    response = client.invoke_model(
        modelId=EMBED_MODEL_ID,
        body=json.dumps({"inputText": text}),
    )
    payload = json.loads(response["body"].read())
    return payload["embedding"]


def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


INDEX_PATH = os.path.join(os.path.dirname(__file__), "data", "profile_index.json")

_index_cache: Optional[List[Chunk]] = None


def load_index() -> List[Chunk]:
    global _index_cache
    if _index_cache is None:
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        _index_cache = [Chunk(**item) for item in data]
    return _index_cache


def get_chunk(chunk_id: str) -> Chunk:
    for chunk in load_index():
        if chunk.chunk_id == chunk_id:
            return chunk
    raise KeyError(f"No chunk with id {chunk_id!r}")


def retrieve(query: str, k: int = 5, index: Optional[List[Chunk]] = None) -> List[Tuple[Chunk, float]]:
    if index is None:
        index = load_index()
    query_embedding = embed_text(query)
    scored = [(chunk, cosine_similarity(query_embedding, chunk.embedding)) for chunk in index]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:k]

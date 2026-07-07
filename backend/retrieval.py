import os
import re
import json
import math
import boto3
from dataclasses import dataclass
from typing import List, Optional

PROFILE_PATH = os.path.join(os.path.dirname(__file__), "data", "akash_persetti_profile.txt")
EMBED_MODEL_ID = os.getenv("EMBED_MODEL_ID", "amazon.titan-embed-text-v2:0")

# Global Bedrock client cache
_bedrock_client = None


def get_bedrock_client():
    """
    Get or create a cached boto3 bedrock-runtime client.

    Uses lazy initialization with a global module-level cache.
    """
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client(
            service_name="bedrock-runtime",
            region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1")
        )
    return _bedrock_client


@dataclass
class Chunk:
    """Represents a chunk of profile text."""
    chunk_id: str
    section_title: str
    text: str
    embedding: Optional[List[float]] = None


def slugify(title: str) -> str:
    """
    Convert a title to a slug.

    - Lowercase the title
    - Replace non-alphanumeric runs (spaces, special chars) with single dashes
    - Strip leading/trailing dashes
    """
    # Lowercase
    slug = title.lower()
    # Replace non-alphanumeric runs with single dash
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    # Strip leading/trailing dashes
    slug = slug.strip('-')
    return slug


def chunk_profile_text(text: str) -> List[Chunk]:
    """
    Split profile text into chunks by section headers.

    Splits on '## ' headers and produces one Chunk per section.
    """
    chunks = []

    # Split on '## ' headers
    sections = text.split('## ')

    # First section (before first ##) is typically preamble, skip it
    for section in sections[1:]:
        lines = section.split('\n', 1)
        section_title = lines[0].strip()
        section_text = lines[1].strip() if len(lines) > 1 else ""

        chunk_id = slugify(section_title)

        chunks.append(Chunk(
            chunk_id=chunk_id,
            section_title=section_title,
            text=section_text
        ))

    return chunks


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Compute cosine similarity between two vectors.

    Returns the cosine of the angle between vectors a and b.
    Returns 0.0 if either vector has zero norm.
    """
    # Compute dot product
    dot_product = sum(x * y for x, y in zip(a, b))

    # Compute norms
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))

    # Return 0.0 if either norm is zero, otherwise return cosine similarity
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def embed_text(text: str) -> List[float]:
    """
    Generate embeddings for text using AWS Bedrock.

    Calls the Bedrock embedding service and returns the embedding vector.
    """
    client = get_bedrock_client()

    body = json.dumps({"inputText": text})
    response = client.invoke_model(
        modelId=EMBED_MODEL_ID,
        body=body
    )

    response_body = json.loads(response["body"].read())
    return response_body["embedding"]

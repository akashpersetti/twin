"""
Build and save the profile embedding index.

This script loads the profile text from backend/data/akash_persetti_profile.txt,
chunks it by sections, embeds each chunk, and writes the index to
backend/data/profile_index.json.

Usage:
    cd backend
    uv run python build_profile_index.py
"""

import os
import json
from dataclasses import asdict
from typing import List

import retrieval

INDEX_PATH = os.path.join(os.path.dirname(__file__), "data", "profile_index.json")


def build_index(profile_text: str, embed_fn=retrieval.embed_text) -> List[dict]:
    """
    Build an embedding index from profile text.

    Chunks the profile text by section headers, embeds each chunk, and returns
    a list of dicts with all chunk fields including embeddings.

    Args:
        profile_text: The full profile text to index
        embed_fn: Embedding function (default: retrieval.embed_text)

    Returns:
        List of dicts, each with chunk_id, section_title, text, and embedding.
    """
    # Chunk the profile text
    chunks = retrieval.chunk_profile_text(profile_text)

    # Embed each chunk
    index = []
    for chunk in chunks:
        # Embed the chunk text
        embedding = embed_fn(chunk.text)

        # Set the embedding on the chunk
        chunk.embedding = embedding

        # Convert to dict and add to index
        index.append(asdict(chunk))

    return index


def main():
    """Load profile, build index, write to file."""
    # Load the profile text
    profile_path = os.path.join(os.path.dirname(__file__), "data", "akash_persetti_profile.txt")
    with open(profile_path, 'r') as f:
        profile_text = f.read()

    # Build the index
    index = build_index(profile_text)

    # Write to file
    with open(INDEX_PATH, 'w') as f:
        json.dump(index, f, indent=2)

    print(f"Wrote {len(index)} chunks to {INDEX_PATH}")


if __name__ == "__main__":
    main()

import json
import os
from dataclasses import asdict

import retrieval

INDEX_PATH = os.path.join(os.path.dirname(__file__), "data", "profile_index.json")


def build_index(profile_text: str):
    chunks = retrieval.chunk_profile_text(profile_text)
    result = []
    for chunk in chunks:
        chunk.embedding = retrieval.embed_text(chunk.text)
        result.append(asdict(chunk))
    return result


def main():
    with open(retrieval.PROFILE_PATH, "r", encoding="utf-8") as f:
        profile_text = f.read()
    index = build_index(profile_text)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)
    print(f"Wrote {len(index)} chunks to {INDEX_PATH}")


if __name__ == "__main__":
    main()

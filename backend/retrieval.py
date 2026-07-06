import os
import re
from dataclasses import dataclass
from typing import List, Optional

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

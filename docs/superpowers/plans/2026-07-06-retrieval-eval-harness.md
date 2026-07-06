# Retrieval + Eval Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Twin's full-document prompt stuffing with a minimal Titan-embedding retrieval step over a chunked persona corpus, then build an `evals/` harness that measures retrieval quality (recall@k, nDCG@k) and end-to-end answer faithfulness against ~35 hand-labeled queries.

**Architecture:** `backend/retrieval.py` chunks `backend/data/akash_persetti_profile.txt` into 16 sections, embeds each with Bedrock Titan, and does in-memory cosine similarity at request time against a precomputed `backend/data/profile_index.json`. `context.py`/`server.py` swap the full-resume prompt block for the top-k retrieved chunks. `evals/` runs the real pipeline against a labeled query set, scoring retrieval with recall@k/nDCG@k and answer faithfulness with an LLM-judge Bedrock call.

**Tech Stack:** Python 3.12, boto3 (Bedrock `bedrock-runtime`), `amazon.titan-embed-text-v2:0` for embeddings, existing `BEDROCK_MODEL_ID` (Claude Sonnet) for chat and judging, pytest, no new dependencies.

## Global Constraints

- No new Python dependencies (no numpy, no vector DB client) — corpus is 16 chunks, plain-Python cosine similarity.
- `facts.json`, `summary.txt`, `style.txt` remain always-included in the system prompt, unchanged.
- `resume.pdf` stays in the repo but is no longer parsed at request time.
- Embedding model: `amazon.titan-embed-text-v2:0`. Chat/judge model: existing `BEDROCK_MODEL_ID` env var (defaults to Claude Sonnet).
- Retrieval corpus source: `backend/data/akash_persetti_profile.txt`, chunked on its `## ` headers.
- All 16 chunk IDs are fixed by this plan (see Task 1) — later tasks reference them verbatim.

---

## Task 1: Chunk the profile corpus

**Files:**
- Create: `backend/retrieval.py`
- Test: `backend/tests/test_retrieval.py`

**Interfaces:**
- Produces: `Chunk` dataclass (`chunk_id: str`, `section_title: str`, `text: str`, `embedding: Optional[List[float]] = None`), `slugify(title: str) -> str`, `chunk_profile_text(text: str) -> List[Chunk]`, module constant `PROFILE_PATH`.

The profile file's 16 `## ` headers, in order, slugify (lowercase, non-alphanumeric runs collapsed to a single `-`, stripped of leading/trailing `-`) to these exact `chunk_id` values — later tasks (Task 8's `queries.json`) reference these verbatim:

| Section header | `chunk_id` |
|---|---|
| Identity and Contact | `identity-and-contact` |
| Professional Summary | `professional-summary` |
| Technical Identity and Working Style | `technical-identity-and-working-style` |
| Current Role: AI Engineer at MyEdMaster LLC | `current-role-ai-engineer-at-myedmaster-llc` |
| Previous Role: Machine Learning Intern at MyEdMaster LLC | `previous-role-machine-learning-intern-at-myedmaster-llc` |
| Previous Role: Web Development Intern at Squadcast Labs | `previous-role-web-development-intern-at-squadcast-labs` |
| Project: Wingman (Self-Evaluating Agentic Co-Worker) | `project-wingman-self-evaluating-agentic-co-worker` |
| Project: Twin (Streaming AI Digital Twin) | `project-twin-streaming-ai-digital-twin` |
| Project: TallyMark (Voice + Text Agentic Expense Splitter) | `project-tallymark-voice-text-agentic-expense-splitter` |
| Project: mcp-second-opinion (Open-Source MCP Server) | `project-mcp-second-opinion-open-source-mcp-server` |
| Laxora.ai (Founding Software Engineer) | `laxora-ai-founding-software-engineer` |
| Education | `education` |
| Technical Skills | `technical-skills` |
| Certifications | `certifications` |
| Job Search and Career Direction | `job-search-and-career-direction` |
| Personal Interests | `personal-interests` |

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_retrieval.py
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import retrieval

EXPECTED_CHUNK_IDS = [
    "identity-and-contact",
    "professional-summary",
    "technical-identity-and-working-style",
    "current-role-ai-engineer-at-myedmaster-llc",
    "previous-role-machine-learning-intern-at-myedmaster-llc",
    "previous-role-web-development-intern-at-squadcast-labs",
    "project-wingman-self-evaluating-agentic-co-worker",
    "project-twin-streaming-ai-digital-twin",
    "project-tallymark-voice-text-agentic-expense-splitter",
    "project-mcp-second-opinion-open-source-mcp-server",
    "laxora-ai-founding-software-engineer",
    "education",
    "technical-skills",
    "certifications",
    "job-search-and-career-direction",
    "personal-interests",
]


def test_chunk_profile_text_produces_expected_chunk_ids():
    with open(retrieval.PROFILE_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    chunks = retrieval.chunk_profile_text(text)
    assert [c.chunk_id for c in chunks] == EXPECTED_CHUNK_IDS


def test_chunk_profile_text_chunks_have_nonempty_text():
    with open(retrieval.PROFILE_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    chunks = retrieval.chunk_profile_text(text)
    for chunk in chunks:
        assert chunk.text.strip() != ""


def test_current_role_chunk_has_correct_database():
    with open(retrieval.PROFILE_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    chunks = retrieval.chunk_profile_text(text)
    current_role = next(c for c in chunks if c.chunk_id == "current-role-ai-engineer-at-myedmaster-llc")
    assert "PostgreSQL" in current_role.text
    assert "pgvector" in current_role.text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_retrieval.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'retrieval'`

- [ ] **Step 3: Write minimal implementation**

```python
# backend/retrieval.py
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_retrieval.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/retrieval.py backend/tests/test_retrieval.py
git commit -m "feat(retrieval): chunk persona profile into 16 sections"
```

---

## Task 2: Embedding and cosine similarity

**Files:**
- Modify: `backend/retrieval.py`
- Test: `backend/tests/test_retrieval.py`

**Interfaces:**
- Consumes: nothing new from Task 1 beyond the module itself.
- Produces: `EMBED_MODEL_ID` constant, `get_bedrock_client() -> boto3 client`, `embed_text(text: str) -> List[float]`, `cosine_similarity(a: List[float], b: List[float]) -> float`.

- [ ] **Step 1: Write the failing tests**

```python
# append to backend/tests/test_retrieval.py
import math
from unittest.mock import MagicMock, patch


def test_cosine_similarity_identical_vectors_is_one():
    v = [1.0, 2.0, 3.0]
    assert math.isclose(retrieval.cosine_similarity(v, v), 1.0, rel_tol=1e-9)


def test_cosine_similarity_orthogonal_vectors_is_zero():
    assert math.isclose(retrieval.cosine_similarity([1.0, 0.0], [0.0, 1.0]), 0.0, abs_tol=1e-9)


def test_cosine_similarity_zero_vector_returns_zero():
    assert retrieval.cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0


def test_embed_text_calls_bedrock_and_parses_embedding():
    fake_body = MagicMock()
    fake_body.read.return_value = b'{"embedding": [0.1, 0.2, 0.3]}'
    mock_client = MagicMock()
    mock_client.invoke_model.return_value = {"body": fake_body}

    with patch.object(retrieval, "get_bedrock_client", return_value=mock_client):
        result = retrieval.embed_text("hello world")

    assert result == [0.1, 0.2, 0.3]
    mock_client.invoke_model.assert_called_once()
    call_kwargs = mock_client.invoke_model.call_args.kwargs
    assert call_kwargs["modelId"] == retrieval.EMBED_MODEL_ID
    assert "hello world" in call_kwargs["body"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_retrieval.py -v`
Expected: FAIL with `AttributeError: module 'retrieval' has no attribute 'cosine_similarity'`

- [ ] **Step 3: Write minimal implementation**

```python
# add to backend/retrieval.py, after the imports
import json
import math

import boto3

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_retrieval.py -v`
Expected: PASS (7 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/retrieval.py backend/tests/test_retrieval.py
git commit -m "feat(retrieval): add Titan embedding call and cosine similarity"
```

---

## Task 3: Build the profile index

**Files:**
- Create: `backend/build_profile_index.py`
- Test: `backend/tests/test_build_profile_index.py`
- Modify: `README.md:66-74` (Persona System table — add the index-rebuild note)

**Interfaces:**
- Consumes: `retrieval.PROFILE_PATH`, `retrieval.chunk_profile_text`, `retrieval.embed_text`, `retrieval.Chunk` (Task 1, 2).
- Produces: `build_index(profile_text: str, embed_fn=retrieval.embed_text) -> List[dict]`, `INDEX_PATH` constant, and writes `backend/data/profile_index.json` when run as a script.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_build_profile_index.py
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import build_profile_index
import retrieval


def test_build_index_embeds_every_chunk_and_preserves_fields():
    sample_text = "# Title\n\n## Section One\nBody one.\n\n## Section Two\nBody two.\n"

    with patch.object(retrieval, "embed_text", side_effect=lambda t: [len(t) * 1.0]):
        result = build_profile_index.build_index(sample_text)

    assert len(result) == 2
    assert result[0]["chunk_id"] == "section-one"
    assert result[0]["section_title"] == "Section One"
    assert result[0]["text"] == "Body one."
    assert result[0]["embedding"] == [len("Body one.") * 1.0]
    assert result[1]["chunk_id"] == "section-two"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_build_profile_index.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'build_profile_index'`

- [ ] **Step 3: Write minimal implementation**

```python
# backend/build_profile_index.py
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
```

Note: `test_build_index_embeds_every_chunk_and_preserves_fields` patches `retrieval.embed_text`
directly (not `build_profile_index.embed_text`) because `build_index` calls it as
`retrieval.embed_text(...)`, not via a local import — this keeps the patch target correct.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_build_profile_index.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Add the index-rebuild note to README.md**

In `README.md`, immediately after the existing Persona System table (the one listing
`facts.json`, `summary.txt`, `style.txt`, `linkedin.pdf`), add:

```markdown
Retrieval index: `backend/data/profile_index.json` is a precomputed embedding index built from
`backend/data/akash_persetti_profile.txt`. Regenerate it whenever that file changes:

​```bash
cd backend
uv run python build_profile_index.py
​```
```

(Use real triple-backtick fences in the README, not the escaped ones shown above.)

- [ ] **Step 6: Commit**

```bash
git add backend/build_profile_index.py backend/tests/test_build_profile_index.py README.md
git commit -m "feat(retrieval): add profile index build script"
```

---

## Task 4: Load the index and retrieve top-k chunks

**Files:**
- Modify: `backend/retrieval.py`
- Test: `backend/tests/test_retrieval.py`

**Interfaces:**
- Consumes: `Chunk`, `cosine_similarity`, `embed_text` (Tasks 1-2); `backend/data/profile_index.json` shape from Task 3 (`list[{chunk_id, section_title, text, embedding}]`).
- Produces: `load_index() -> List[Chunk]`, `get_chunk(chunk_id: str) -> Chunk`, `retrieve(query: str, k: int = 5, index: Optional[List[Chunk]] = None) -> List[Tuple[Chunk, float]]`.

- [ ] **Step 1: Write the failing tests**

```python
# append to backend/tests/test_retrieval.py
import tempfile


def _sample_index():
    return [
        retrieval.Chunk(chunk_id="a", section_title="A", text="about a", embedding=[1.0, 0.0]),
        retrieval.Chunk(chunk_id="b", section_title="B", text="about b", embedding=[0.0, 1.0]),
        retrieval.Chunk(chunk_id="c", section_title="C", text="about c", embedding=[0.9, 0.1]),
    ]


def test_retrieve_ranks_by_similarity_with_given_index():
    index = _sample_index()
    with patch.object(retrieval, "embed_text", return_value=[1.0, 0.0]):
        results = retrieval.retrieve("query about a", k=2, index=index)

    assert [chunk.chunk_id for chunk, score in results] == ["a", "c"]


def test_load_index_reads_json_file():
    payload = [
        {"chunk_id": "a", "section_title": "A", "text": "about a", "embedding": [1.0, 0.0]},
    ]
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(payload, f)
        temp_path = f.name

    with patch.object(retrieval, "INDEX_PATH", temp_path):
        retrieval._index_cache = None
        chunks = retrieval.load_index()

    assert len(chunks) == 1
    assert chunks[0].chunk_id == "a"
    os.remove(temp_path)


def test_get_chunk_returns_matching_chunk():
    index = _sample_index()
    with patch.object(retrieval, "load_index", return_value=index):
        chunk = retrieval.get_chunk("b")
    assert chunk.section_title == "B"


def test_get_chunk_raises_for_unknown_id():
    index = _sample_index()
    with patch.object(retrieval, "load_index", return_value=index):
        try:
            retrieval.get_chunk("does-not-exist")
            assert False, "expected KeyError"
        except KeyError:
            pass
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_retrieval.py -v`
Expected: FAIL with `AttributeError: module 'retrieval' has no attribute 'retrieve'`

- [ ] **Step 3: Write minimal implementation**

```python
# add to backend/retrieval.py
from typing import Tuple

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
```

Remove the now-duplicate `INDEX_PATH` if it was already added elsewhere — this task is the only
place it's defined (Task 3's `build_profile_index.py` imports it from `retrieval`, not the other
way around, so update `build_profile_index.py`'s `INDEX_PATH` definition to
`INDEX_PATH = retrieval.INDEX_PATH` instead of redefining it).

- [ ] **Step 4: Update build_profile_index.py to reuse retrieval.INDEX_PATH**

```python
# in backend/build_profile_index.py, replace the INDEX_PATH line with:
INDEX_PATH = retrieval.INDEX_PATH
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_retrieval.py tests/test_build_profile_index.py -v`
Expected: PASS (12 passed)

- [ ] **Step 6: Commit**

```bash
git add backend/retrieval.py backend/build_profile_index.py backend/tests/test_retrieval.py
git commit -m "feat(retrieval): add index loading, chunk lookup, and top-k retrieval"
```

---

## Task 5: Retire the full-resume prompt block

**Files:**
- Modify: `backend/resources.py`
- Modify: `backend/context.py`
- Test: `backend/tests/test_context.py` (new)

**Interfaces:**
- Consumes: nothing from retrieval — this task only changes what `prompt()` accepts.
- Produces: `context.prompt(profile_context: str) -> str` (was `prompt()` with no params).

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_context.py
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from context import prompt


def test_prompt_includes_given_profile_context():
    result = prompt(profile_context="Some retrieved section text.")
    assert "Some retrieved section text." in result


def test_prompt_does_not_reference_full_resume_dump():
    result = prompt(profile_context="Some retrieved section text.")
    assert "Resume not available" not in result
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_context.py -v`
Expected: FAIL with `TypeError: prompt() got an unexpected keyword argument 'profile_context'`

- [ ] **Step 3: Update resources.py to drop the resume parse**

```python
# backend/resources.py — full new contents
import json

with open("./data/summary.txt", "r", encoding="utf-8") as f:
    summary = f.read()

with open("./data/style.txt", "r", encoding="utf-8") as f:
    style = f.read()

with open("./data/facts.json", "r", encoding="utf-8") as f:
    facts = json.load(f)
```

- [ ] **Step 4: Update context.py**

In `backend/context.py`, change line 1 from:

```python
from resources import resume, summary, facts, style
```

to:

```python
from resources import summary, facts, style
```

Change the function signature on line 9 from:

```python
def prompt():
```

to:

```python
def prompt(profile_context: str):
```

Change the "Resume:" block (lines 34-35) from:

```

Resume:
{resume}
```

to:

```

Relevant background:
{profile_context}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_context.py -v`
Expected: PASS (2 passed)

- [ ] **Step 6: Commit**

```bash
git add backend/resources.py backend/context.py backend/tests/test_context.py
git commit -m "refactor(context): replace full-resume dump with retrieved profile_context param"
```

---

## Task 6: Wire retrieval into the chat pipeline

**Files:**
- Modify: `backend/server.py:122-144` (`build_bedrock_messages`)
- Modify: `backend/tests/test_onboarding.py`

**Interfaces:**
- Consumes: `context.prompt(profile_context: str)` (Task 5), `retrieval.retrieve(query, k=5)`, `retrieval.get_chunk(chunk_id)` (Task 4).
- Produces: `server.build_bedrock_messages` unchanged in name/signature, but now retrieval-backed.

`build_bedrock_messages` currently calls `prompt()` with no arguments. It must now source
`profile_context` from retrieval: for a real user message, retrieve the top-5 chunks and join
their text; for the `__greet__` sentinel, skip retrieval entirely and use the Professional
Summary chunk directly (there is no real question yet to embed).

- [ ] **Step 1: Update the existing tests to mock retrieval**

`test_onboarding.py` calls `build_bedrock_messages` directly without AWS credentials configured.
Once this function calls `retrieval.retrieve`/`retrieval.get_chunk`, those tests must mock
retrieval or they'll attempt real Bedrock calls. Update the top of
`backend/tests/test_onboarding.py`:

```python
# backend/tests/test_onboarding.py — add these imports and a fixture near the top,
# right after the existing `client = TestClient(app)` line
import retrieval
from unittest.mock import patch
import pytest


@pytest.fixture(autouse=True)
def mock_retrieval():
    fake_chunk = retrieval.Chunk(
        chunk_id="professional-summary",
        section_title="Professional Summary",
        text="Applied AI engineer summary.",
        embedding=[0.1, 0.2],
    )
    with patch.object(retrieval, "retrieve", return_value=[(fake_chunk, 0.9)]), \
         patch.object(retrieval, "get_chunk", return_value=fake_chunk):
        yield
```

Add one new test to the same file:

```python
def test_greet_sentinel_skips_retrieval_and_uses_summary_chunk():
    with patch.object(retrieval, "retrieve") as mock_retrieve:
        msgs = build_bedrock_messages([], "__greet__")
    mock_retrieve.assert_not_called()
    system_text = msgs[0]["content"][0]["text"]
    assert "Applied AI engineer summary." in system_text


def test_regular_message_calls_retrieve_with_user_message():
    with patch.object(retrieval, "retrieve") as mock_retrieve:
        fake_chunk = retrieval.Chunk(
            chunk_id="project-twin-streaming-ai-digital-twin",
            section_title="Project: Twin",
            text="Twin details.",
            embedding=[0.1, 0.2],
        )
        mock_retrieve.return_value = [(fake_chunk, 0.95)]
        msgs = build_bedrock_messages([], "Tell me about Twin")

    mock_retrieve.assert_called_once_with("Tell me about Twin", k=5)
    system_text = msgs[0]["content"][0]["text"]
    assert "Twin details." in system_text
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd backend && uv run pytest tests/test_onboarding.py -v`
Expected: FAIL — `build_bedrock_messages` doesn't call `retrieval.retrieve`/`get_chunk` yet, and
`prompt()` now requires `profile_context` so the existing calls also start erroring.

- [ ] **Step 3: Update server.py**

In `backend/server.py`, add the import near the top (after `from context import prompt`):

```python
import retrieval
```

Replace `build_bedrock_messages` (lines 122-144) with:

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_onboarding.py -v`
Expected: PASS (all tests, including the 2 new ones)

- [ ] **Step 5: Run the full backend test suite**

Run: `cd backend && uv run pytest -v`
Expected: PASS (no regressions in `test_blog.py`; `test_onboarding.py` and `test_retrieval.py`,
`test_build_profile_index.py`, `test_context.py` all pass)

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_onboarding.py
git commit -m "feat(server): retrieve top-k profile chunks per query instead of full resume dump"
```

---

## Task 7: Generate the real index and verify locally

This task requires live AWS Bedrock access (Titan Embeddings model enabled) — it cannot be
completed by code alone.

**Files:** none (generates `backend/data/profile_index.json`, which is a data artifact, not
hand-edited)

- [ ] **Step 1: Confirm Titan Embeddings model access is enabled**

In the AWS Bedrock console for the account/region used by `DEFAULT_AWS_REGION`, confirm
`amazon.titan-embed-text-v2:0` shows as "Access granted" under Model access. If not, request
access before continuing (this is a manual AWS console action, not scriptable).

- [ ] **Step 2: Build the index**

Run: `cd backend && uv run python build_profile_index.py`
Expected output: `Wrote 16 chunks to /path/to/backend/data/profile_index.json`

- [ ] **Step 3: Sanity-check the generated file**

Run: `cd backend && uv run python -c "import json; data = json.load(open('data/profile_index.json')); print(len(data)); print(data[0]['chunk_id']); print(len(data[0]['embedding']))"`
Expected: `16`, `identity-and-contact`, and an embedding dimension (1024 for Titan V2 defaults).

- [ ] **Step 4: Run the backend locally and manually verify retrieval**

Run: `cd backend && uv run uvicorn server:app --reload --port 8000`

In another terminal:

```bash
curl -s -X POST http://localhost:8000/chat -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Wingman"}' | python3 -m json.tool
```

Expected: a response that describes the Wingman project specifically (LangGraph worker-evaluator
state machine), confirming retrieval surfaced the right chunk. Also try a question that should
retrieve nothing relevant, e.g. `{"message": "Do you know Kubernetes?"}`, and confirm the answer
states the information isn't available rather than fabricating one.

- [ ] **Step 5: Commit the generated index**

```bash
git add backend/data/profile_index.json
git commit -m "chore(retrieval): generate profile_index.json"
```

---

## Task 8: Author the eval query set

**Files:**
- Create: `evals/queries.json`
- Create: `evals/tests/__init__.py`
- Test: `evals/tests/test_queries.py`

**Interfaces:**
- Consumes: the 16 `chunk_id` values from Task 1.
- Produces: `evals/queries.json` — a list of `{id, category, query, relevant_chunk_ids}` objects,
  consumed by Task 11's `run_eval.py`.

- [ ] **Step 1: Write the failing test**

```python
# evals/tests/test_queries.py
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

import retrieval

QUERIES_PATH = os.path.join(os.path.dirname(__file__), "..", "queries.json")

VALID_CHUNK_IDS = {
    "identity-and-contact",
    "professional-summary",
    "technical-identity-and-working-style",
    "current-role-ai-engineer-at-myedmaster-llc",
    "previous-role-machine-learning-intern-at-myedmaster-llc",
    "previous-role-web-development-intern-at-squadcast-labs",
    "project-wingman-self-evaluating-agentic-co-worker",
    "project-twin-streaming-ai-digital-twin",
    "project-tallymark-voice-text-agentic-expense-splitter",
    "project-mcp-second-opinion-open-source-mcp-server",
    "laxora-ai-founding-software-engineer",
    "education",
    "technical-skills",
    "certifications",
    "job-search-and-career-direction",
    "personal-interests",
}

VALID_CATEGORIES = {"single-chunk", "multi-chunk", "out-of-corpus", "personal-guardrail"}


def _load_queries():
    with open(QUERIES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_query_count_in_expected_range():
    queries = _load_queries()
    assert 30 <= len(queries) <= 40


def test_all_ids_unique():
    queries = _load_queries()
    ids = [q["id"] for q in queries]
    assert len(ids) == len(set(ids))


def test_all_categories_valid():
    queries = _load_queries()
    for q in queries:
        assert q["category"] in VALID_CATEGORIES


def test_all_relevant_chunk_ids_exist():
    queries = _load_queries()
    for q in queries:
        for cid in q["relevant_chunk_ids"]:
            assert cid in VALID_CHUNK_IDS, f"{q['id']} references unknown chunk_id {cid}"


def test_out_of_corpus_queries_have_no_relevant_chunks():
    queries = _load_queries()
    for q in queries:
        if q["category"] == "out-of-corpus":
            assert q["relevant_chunk_ids"] == []


def test_personal_guardrail_queries_target_personal_interests():
    queries = _load_queries()
    for q in queries:
        if q["category"] == "personal-guardrail":
            assert q["relevant_chunk_ids"] == ["personal-interests"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd evals && uv run --project ../backend pytest tests/test_queries.py -v`
Expected: FAIL with `FileNotFoundError` (queries.json doesn't exist yet)

- [ ] **Step 3: Create evals/queries.json**

```json
[
  {"id": "q01", "category": "single-chunk", "query": "What's the best way to reach you?", "relevant_chunk_ids": ["identity-and-contact"]},
  {"id": "q02", "category": "single-chunk", "query": "Give me a quick summary of what you do professionally.", "relevant_chunk_ids": ["professional-summary"]},
  {"id": "q03", "category": "single-chunk", "query": "Do you work in an IDE or from the terminal?", "relevant_chunk_ids": ["technical-identity-and-working-style"]},
  {"id": "q04", "category": "single-chunk", "query": "What are you working on in your current role at MyEdMaster?", "relevant_chunk_ids": ["current-role-ai-engineer-at-myedmaster-llc"]},
  {"id": "q05", "category": "single-chunk", "query": "Tell me about your machine learning internship.", "relevant_chunk_ids": ["previous-role-machine-learning-intern-at-myedmaster-llc"]},
  {"id": "q06", "category": "single-chunk", "query": "What did you do during your web development internship?", "relevant_chunk_ids": ["previous-role-web-development-intern-at-squadcast-labs"]},
  {"id": "q07", "category": "single-chunk", "query": "What is Wingman and how does it work?", "relevant_chunk_ids": ["project-wingman-self-evaluating-agentic-co-worker"]},
  {"id": "q08", "category": "single-chunk", "query": "How is the Twin project deployed?", "relevant_chunk_ids": ["project-twin-streaming-ai-digital-twin"]},
  {"id": "q09", "category": "single-chunk", "query": "What does TallyMark do?", "relevant_chunk_ids": ["project-tallymark-voice-text-agentic-expense-splitter"]},
  {"id": "q10", "category": "single-chunk", "query": "Tell me about the MCP server you published.", "relevant_chunk_ids": ["project-mcp-second-opinion-open-source-mcp-server"]},
  {"id": "q11", "category": "single-chunk", "query": "What's Laxora and what's your role there?", "relevant_chunk_ids": ["laxora-ai-founding-software-engineer"]},
  {"id": "q12", "category": "single-chunk", "query": "What's your educational background?", "relevant_chunk_ids": ["education"]},
  {"id": "q13", "category": "single-chunk", "query": "What programming languages do you know?", "relevant_chunk_ids": ["technical-skills"]},
  {"id": "q14", "category": "single-chunk", "query": "Do you have any certifications?", "relevant_chunk_ids": ["certifications"]},
  {"id": "q15", "category": "single-chunk", "query": "Are you currently looking for new job opportunities?", "relevant_chunk_ids": ["job-search-and-career-direction"]},
  {"id": "q16", "category": "personal-guardrail", "query": "What do you like to do for fun outside of work?", "relevant_chunk_ids": ["personal-interests"]},
  {"id": "q17", "category": "personal-guardrail", "query": "Are you a cricket fan? Who do you support?", "relevant_chunk_ids": ["personal-interests"]},
  {"id": "q18", "category": "personal-guardrail", "query": "What kind of movies or shows do you watch?", "relevant_chunk_ids": ["personal-interests"]},
  {"id": "q19", "category": "personal-guardrail", "query": "Do you cook? What's your favorite dish to make?", "relevant_chunk_ids": ["personal-interests"]},
  {"id": "q20", "category": "multi-chunk", "query": "What cloud and DevOps tools have you used across your jobs and projects?", "relevant_chunk_ids": ["current-role-ai-engineer-at-myedmaster-llc", "project-wingman-self-evaluating-agentic-co-worker", "project-twin-streaming-ai-digital-twin", "laxora-ai-founding-software-engineer", "technical-skills"]},
  {"id": "q21", "category": "multi-chunk", "query": "Walk me through your career progression from your first internship to now.", "relevant_chunk_ids": ["previous-role-web-development-intern-at-squadcast-labs", "previous-role-machine-learning-intern-at-myedmaster-llc", "current-role-ai-engineer-at-myedmaster-llc"]},
  {"id": "q22", "category": "multi-chunk", "query": "Which of your projects involve LangGraph?", "relevant_chunk_ids": ["project-wingman-self-evaluating-agentic-co-worker", "project-tallymark-voice-text-agentic-expense-splitter"]},
  {"id": "q23", "category": "multi-chunk", "query": "What experience do you have with retrieval-augmented generation or vector databases?", "relevant_chunk_ids": ["current-role-ai-engineer-at-myedmaster-llc", "technical-skills"]},
  {"id": "q24", "category": "multi-chunk", "query": "What's your full educational and certification background?", "relevant_chunk_ids": ["education", "certifications"]},
  {"id": "q25", "category": "multi-chunk", "query": "Which of your projects are deployed on AWS?", "relevant_chunk_ids": ["project-wingman-self-evaluating-agentic-co-worker", "project-twin-streaming-ai-digital-twin", "laxora-ai-founding-software-engineer"]},
  {"id": "q26", "category": "multi-chunk", "query": "What are all the ways someone could get in touch with you or follow your work?", "relevant_chunk_ids": ["identity-and-contact", "job-search-and-career-direction"]},
  {"id": "q27", "category": "multi-chunk", "query": "Have you built anything involving computer vision or pose estimation?", "relevant_chunk_ids": ["previous-role-machine-learning-intern-at-myedmaster-llc", "technical-skills"]},
  {"id": "q28", "category": "out-of-corpus", "query": "Do you have experience with Kubernetes?", "relevant_chunk_ids": []},
  {"id": "q29", "category": "out-of-corpus", "query": "Have you worked with Rust or Go?", "relevant_chunk_ids": []},
  {"id": "q30", "category": "out-of-corpus", "query": "Are you willing to relocate to Canada?", "relevant_chunk_ids": []},
  {"id": "q31", "category": "out-of-corpus", "query": "What's your favorite programming language and why do you dislike the others?", "relevant_chunk_ids": []},
  {"id": "q32", "category": "out-of-corpus", "query": "Do you have a driver's license?", "relevant_chunk_ids": []},
  {"id": "q33", "category": "out-of-corpus", "query": "Have you published any peer-reviewed research papers?", "relevant_chunk_ids": []},
  {"id": "q34", "category": "out-of-corpus", "query": "What's your Twitter/X handle?", "relevant_chunk_ids": []},
  {"id": "q35", "category": "out-of-corpus", "query": "Can you help me debug my own Kubernetes cluster right now?", "relevant_chunk_ids": []}
]
```

Also create the empty test package marker:

```python
# evals/tests/__init__.py
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd evals && uv run --project ../backend pytest tests/test_queries.py -v`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add evals/queries.json evals/tests/__init__.py evals/tests/test_queries.py
git commit -m "test(evals): author 35-query labeled eval set across 4 categories"
```

---

## Task 9: Retrieval metrics

**Files:**
- Create: `evals/metrics.py`
- Test: `evals/tests/test_metrics.py`

**Interfaces:**
- Produces: `recall_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]`,
  `ndcg_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]`.
  Both return `None` when `relevant_ids` is empty (undefined for out-of-corpus queries — Task 11
  must exclude `None` results from aggregate averages).

- [ ] **Step 1: Write the failing test**

```python
# evals/tests/test_metrics.py
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import metrics


def test_recall_at_k_all_relevant_retrieved():
    assert metrics.recall_at_k(["a", "b", "c"], ["a", "b"], k=3) == 1.0


def test_recall_at_k_partial_match():
    assert metrics.recall_at_k(["a", "x", "y"], ["a", "b"], k=3) == 0.5


def test_recall_at_k_respects_k_cutoff():
    assert metrics.recall_at_k(["x", "y", "a"], ["a"], k=2) == 0.0


def test_recall_at_k_empty_relevant_returns_none():
    assert metrics.recall_at_k(["a", "b"], [], k=3) is None


def test_ndcg_at_k_perfect_ranking_is_one():
    result = metrics.ndcg_at_k(["a", "b", "x"], ["a", "b"], k=3)
    assert math.isclose(result, 1.0, rel_tol=1e-9)


def test_ndcg_at_k_worse_ranking_is_less_than_one():
    result = metrics.ndcg_at_k(["x", "a", "b"], ["a", "b"], k=3)
    expected_dcg = (1.0 / math.log2(3)) + (1.0 / math.log2(4))
    expected_idcg = (1.0 / math.log2(2)) + (1.0 / math.log2(3))
    assert math.isclose(result, expected_dcg / expected_idcg, rel_tol=1e-9)


def test_ndcg_at_k_empty_relevant_returns_none():
    assert metrics.ndcg_at_k(["a", "b"], [], k=3) is None


def test_ndcg_at_k_no_hits_is_zero():
    assert metrics.ndcg_at_k(["x", "y"], ["a"], k=2) == 0.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd evals && uv run --project ../backend pytest tests/test_metrics.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'metrics'`

- [ ] **Step 3: Write minimal implementation**

```python
# evals/metrics.py
import math
from typing import List, Optional


def recall_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]:
    if not relevant_ids:
        return None
    retrieved_top_k = set(retrieved_ids[:k])
    relevant_set = set(relevant_ids)
    return len(retrieved_top_k & relevant_set) / len(relevant_set)


def ndcg_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]:
    if not relevant_ids:
        return None
    relevant_set = set(relevant_ids)
    dcg = sum(
        (1.0 if chunk_id in relevant_set else 0.0) / math.log2(i + 2)
        for i, chunk_id in enumerate(retrieved_ids[:k])
    )
    ideal_hits = min(len(relevant_set), k)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg > 0 else 0.0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd evals && uv run --project ../backend pytest tests/test_metrics.py -v`
Expected: PASS (9 passed)

- [ ] **Step 5: Commit**

```bash
git add evals/metrics.py evals/tests/test_metrics.py
git commit -m "feat(evals): add recall@k and nDCG@k metric functions"
```

---

## Task 10: LLM-judge for answer faithfulness

**Files:**
- Create: `evals/judge.py`
- Test: `evals/tests/test_judge.py`

**Interfaces:**
- Consumes: `server.bedrock_client`, `server.BEDROCK_MODEL_ID` (existing, from `backend/server.py`).
- Produces: `judge_answer(query: str, retrieved_text: str, answer: str) -> dict` returning
  `{"faithful": bool, "hallucinated_claims": list[str], "correctly_refused": bool | None, "rationale": str}`.

- [ ] **Step 1: Write the failing test**

```python
# evals/tests/test_judge.py
import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server
import judge


def test_judge_answer_parses_response_json():
    fake_response = {
        "output": {
            "message": {
                "content": [
                    {
                        "text": (
                            '{"faithful": false, "hallucinated_claims": ["knows Rust"], '
                            '"correctly_refused": false, "rationale": "Invented a skill not in the source."}'
                        )
                    }
                ]
            }
        }
    }
    mock_client = MagicMock()
    mock_client.converse.return_value = fake_response

    with patch.object(server, "bedrock_client", mock_client):
        result = judge.judge_answer("Do you know Rust?", "", "Yes, I'm fluent in Rust.")

    assert result == {
        "faithful": False,
        "hallucinated_claims": ["knows Rust"],
        "correctly_refused": False,
        "rationale": "Invented a skill not in the source.",
    }
    mock_client.converse.assert_called_once()
    call_kwargs = mock_client.converse.call_args.kwargs
    assert call_kwargs["modelId"] == server.BEDROCK_MODEL_ID
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd evals && uv run --project ../backend pytest tests/test_judge.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'judge'`

- [ ] **Step 3: Write minimal implementation**

```python
# evals/judge.py
import json

import server

JUDGE_SYSTEM_PROMPT = """You are grading whether an AI-generated answer is faithful to the provided source material. Be strict: any claim in the answer not directly supported by the source material counts as a hallucination, even if it sounds plausible.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this exact shape:
{"faithful": true or false, "hallucinated_claims": ["...", ...], "correctly_refused": true, false, or null, "rationale": "one sentence"}

Rules:
- "faithful" is false if the answer states any fact not present in the source material.
- "hallucinated_claims" lists each unsupported claim verbatim from the answer. Empty list if none.
- "correctly_refused" is true if the source material contains nothing relevant to the question and the answer clearly states the information isn't available; false if the source material was empty/irrelevant but the answer invented something anyway; null if the source material did contain relevant information (refusal doesn't apply).
- "rationale" is one sentence explaining the verdict."""


def _build_judge_prompt(query: str, retrieved_text: str, answer: str) -> str:
    source = retrieved_text.strip() if retrieved_text.strip() else "(no relevant source material was retrieved)"
    return f"""QUESTION ASKED:
{query}

SOURCE MATERIAL PROVIDED TO THE ANSWERING MODEL:
{source}

ANSWER GIVEN:
{answer}

Grade the answer now."""


def judge_answer(query: str, retrieved_text: str, answer: str) -> dict:
    response = server.bedrock_client.converse(
        modelId=server.BEDROCK_MODEL_ID,
        system=[{"text": JUDGE_SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": _build_judge_prompt(query, retrieved_text, answer)}]}],
        inferenceConfig={"maxTokens": 500, "temperature": 0.0},
    )
    raw = response["output"]["message"]["content"][0]["text"]
    return json.loads(raw)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd evals && uv run --project ../backend pytest tests/test_judge.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Commit**

```bash
git add evals/judge.py evals/tests/test_judge.py
git commit -m "feat(evals): add LLM-judge for answer faithfulness scoring"
```

---

## Task 11: Eval orchestration

**Files:**
- Create: `evals/run_eval.py`
- Test: `evals/tests/test_run_eval.py`

**Interfaces:**
- Consumes: `retrieval.retrieve` (Task 4), `server.call_bedrock` (existing), `judge.judge_answer`
  (Task 10), `metrics.recall_at_k`/`ndcg_at_k` (Task 9), `evals/queries.json` shape (Task 8).
- Produces: `run_all(queries: List[dict]) -> List[dict]`, each result dict containing:
  `id`, `category`, `query`, `relevant_chunk_ids`, `retrieved_chunk_ids`, `recall_at_3`,
  `recall_at_5`, `ndcg_at_5`, `answer`, `judgment`. Also `main()` which loads `queries.json`, runs
  `run_all`, and writes `evals/results/results.json`.

- [ ] **Step 1: Write the failing test**

```python
# evals/tests/test_run_eval.py
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import retrieval
import run_eval


def test_run_all_assembles_expected_result_shape():
    queries = [
        {"id": "q01", "category": "single-chunk", "query": "Tell me about Wingman",
         "relevant_chunk_ids": ["project-wingman-self-evaluating-agentic-co-worker"]},
        {"id": "q02", "category": "out-of-corpus", "query": "Do you know Rust?",
         "relevant_chunk_ids": []},
    ]
    fake_chunk = retrieval.Chunk(
        chunk_id="project-wingman-self-evaluating-agentic-co-worker",
        section_title="Project: Wingman",
        text="Wingman details.",
        embedding=[0.1, 0.2],
    )
    fake_judgment = {"faithful": True, "hallucinated_claims": [], "correctly_refused": None, "rationale": "ok"}

    with patch.object(run_eval.retrieval, "retrieve", return_value=[(fake_chunk, 0.9)]), \
         patch.object(run_eval.server, "call_bedrock", return_value="Wingman is a self-evaluating agent."), \
         patch.object(run_eval.judge, "judge_answer", return_value=fake_judgment):
        results = run_eval.run_all(queries)

    assert len(results) == 2
    first = results[0]
    assert first["id"] == "q01"
    assert first["retrieved_chunk_ids"] == ["project-wingman-self-evaluating-agentic-co-worker"]
    assert first["recall_at_3"] == 1.0
    assert first["recall_at_5"] == 1.0
    assert first["ndcg_at_5"] == 1.0
    assert first["answer"] == "Wingman is a self-evaluating agent."
    assert first["judgment"] == fake_judgment

    second = results[1]
    assert second["id"] == "q02"
    assert second["recall_at_3"] is None
    assert second["recall_at_5"] is None
    assert second["ndcg_at_5"] is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd evals && uv run --project ../backend pytest tests/test_run_eval.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'run_eval'`

- [ ] **Step 3: Write minimal implementation**

```python
# evals/run_eval.py
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import retrieval
import server
import judge
import metrics

QUERIES_PATH = os.path.join(os.path.dirname(__file__), "queries.json")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "results", "results.json")


def run_all(queries):
    results = []
    for q in queries:
        retrieved = retrieval.retrieve(q["query"], k=5)
        retrieved_ids = [chunk.chunk_id for chunk, score in retrieved]
        retrieved_text = "\n\n".join(f"## {chunk.section_title}\n{chunk.text}" for chunk, score in retrieved)

        answer = server.call_bedrock([], q["query"])
        judgment = judge.judge_answer(q["query"], retrieved_text, answer)

        results.append({
            "id": q["id"],
            "category": q["category"],
            "query": q["query"],
            "relevant_chunk_ids": q["relevant_chunk_ids"],
            "retrieved_chunk_ids": retrieved_ids,
            "recall_at_3": metrics.recall_at_k(retrieved_ids, q["relevant_chunk_ids"], k=3),
            "recall_at_5": metrics.recall_at_k(retrieved_ids, q["relevant_chunk_ids"], k=5),
            "ndcg_at_5": metrics.ndcg_at_k(retrieved_ids, q["relevant_chunk_ids"], k=5),
            "answer": answer,
            "judgment": judgment,
        })
    return results


def main():
    with open(QUERIES_PATH, "r", encoding="utf-8") as f:
        queries = json.load(f)
    results = run_all(queries)
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Wrote {len(results)} results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd evals && uv run --project ../backend pytest tests/test_run_eval.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Run the full evals test suite**

Run: `cd evals && uv run --project ../backend pytest tests/ -v`
Expected: PASS (all tests across test_queries.py, test_metrics.py, test_judge.py, test_run_eval.py)

- [ ] **Step 6: Commit**

```bash
git add evals/run_eval.py evals/tests/test_run_eval.py
git commit -m "feat(evals): add eval orchestration tying retrieval, chat, and judge together"
```

---

## Task 12: Run the full eval and write the failure-analysis report

This task requires live AWS Bedrock access (both Titan Embeddings and the chat/judge model) — it
runs 35 real queries through the full pipeline plus 35 judge calls, so it cannot be completed by
code alone. Depends on Task 7's `profile_index.json` already existing.

**Files:**
- Create: `evals/results/results.json` (generated, not hand-written)
- Create: `evals/REPORT.md`
- Create: `evals/README.md`

- [ ] **Step 1: Run the eval**

Run: `cd evals && uv run --project ../backend python run_eval.py`
Expected: `Wrote 35 results to /path/to/evals/results/results.json`

- [ ] **Step 2: Compute aggregate stats for the report**

Run:

```bash
cd evals && uv run --project ../backend python3 -c "
import json
from collections import defaultdict

results = json.load(open('results/results.json'))
by_category = defaultdict(list)
for r in results:
    by_category[r['category']].append(r)

for cat, items in by_category.items():
    recalls_5 = [r['recall_at_5'] for r in items if r['recall_at_5'] is not None]
    ndcgs_5 = [r['ndcg_at_5'] for r in items if r['ndcg_at_5'] is not None]
    faithful_count = sum(1 for r in items if r['judgment']['faithful'])
    print(cat, 'n=', len(items),
          'avg_recall@5=', round(sum(recalls_5) / len(recalls_5), 3) if recalls_5 else 'n/a',
          'avg_ndcg@5=', round(sum(ndcgs_5) / len(ndcgs_5), 3) if ndcgs_5 else 'n/a',
          'faithful_rate=', round(faithful_count / len(items), 3))
"
```

Record this output — it's the source data for the results table in Step 3.

- [ ] **Step 3: Write evals/README.md**

```markdown
# Twin Retrieval Eval

Evaluates Twin's retrieval (recall@k, nDCG@k against hand-labeled relevant chunks) and end-to-end
answer faithfulness (LLM-judge) across 35 queries in `queries.json`, spanning four categories:
single-chunk factual, multi-chunk aggregate, out-of-corpus (should-refuse), and personal-life
guardrail probes.

## Running

```bash
cd evals
uv run --project ../backend pytest tests/ -v   # unit tests, no AWS calls
uv run --project ../backend python run_eval.py # full live run, requires AWS Bedrock access
```

Results land in `results/results.json`. See `REPORT.md` for the latest findings.
```

- [ ] **Step 4: Write evals/REPORT.md**

Using the actual numbers from Step 2's output and the actual per-query `judgment.rationale`
entries in `results/results.json` (not invented numbers), write `evals/REPORT.md` with:

1. A markdown table with one row per category: `n`, `avg recall@5`, `avg nDCG@5`, `faithful rate`.
2. A "Where it breaks" section: read through every result where `judgment.faithful` is `false` or
   (for out-of-corpus queries) `judgment.correctly_refused` is `false`, and for each one quote the
   query, the retrieved chunk IDs, and the judge's rationale. Group recurring patterns (e.g. "the
   embedding model over-matches on shared keywords like AWS across projects" or "personal-interests
   guardrail broke on N/4 probes despite correct retrieval").
3. A short paragraph on whether the resume-only-scoped retrieval design (Task 1's decision) held
   up, referencing specific query IDs as evidence.

- [ ] **Step 5: Commit**

```bash
git add evals/results/results.json evals/REPORT.md evals/README.md
git commit -m "docs(evals): run full eval and document retrieval + faithfulness findings"
```

---

## Self-Review Notes

- **Spec coverage:** Chunking (Task 1) ✓, embeddings/cosine similarity (Task 2) ✓, index build
  script (Task 3) ✓, retrieval/load/get_chunk (Task 4) ✓, prompt wiring in context.py (Task 5) ✓,
  prompt wiring in server.py including `__greet__` handling (Task 6) ✓, real index generation and
  manual verification (Task 7) ✓, queries.json with 4 categories (Task 8) ✓, recall@k/nDCG@k
  (Task 9) ✓, LLM-judge (Task 10) ✓, orchestration (Task 11) ✓, results + REPORT.md (Task 12) ✓.
  README note about regenerating the index is folded into Task 3. No spec section is uncovered.
- **Placeholder scan:** no TBD/TODO; Task 12's report-writing steps give concrete instructions
  and a real computation script rather than pre-written analysis, since that content depends on
  live data that doesn't exist until the eval actually runs.
- **Type consistency:** `Chunk` fields (`chunk_id`, `section_title`, `text`, `embedding`) are used
  identically across Tasks 1, 3, 4, 6, 11. `retrieve()`'s return type
  (`List[Tuple[Chunk, float]]`) is unpacked the same way (`for chunk, score in ...`) in Task 6 and
  Task 11. `judge_answer()`'s return shape matches what Task 11's `run_all` stores under
  `"judgment"` and what Task 12's report script reads (`judgment.faithful`,
  `judgment.correctly_refused`, `judgment.rationale`).

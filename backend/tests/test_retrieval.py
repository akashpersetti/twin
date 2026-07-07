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

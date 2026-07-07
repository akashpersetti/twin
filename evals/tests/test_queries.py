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

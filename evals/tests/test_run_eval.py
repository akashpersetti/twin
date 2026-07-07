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

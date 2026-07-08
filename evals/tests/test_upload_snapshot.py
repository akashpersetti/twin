import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import upload_snapshot


SAMPLE_RESULTS = [
    {
        "id": "q01", "category": "single-chunk", "query": "q1",
        "relevant_chunk_ids": ["a"], "retrieved_chunk_ids": ["a"],
        "recall_at_3": 1.0, "recall_at_5": 1.0, "ndcg_at_5": 1.0,
        "answer": "ans1", "judgment": {"faithful": True, "hallucinated_claims": [], "correctly_refused": None, "rationale": "ok"},
    },
    {
        "id": "q02", "category": "single-chunk", "query": "q2",
        "relevant_chunk_ids": ["b"], "retrieved_chunk_ids": ["c"],
        "recall_at_3": 0.0, "recall_at_5": 0.0, "ndcg_at_5": 0.0,
        "answer": "ans2", "judgment": {"faithful": False, "hallucinated_claims": ["x"], "correctly_refused": False, "rationale": "bad"},
    },
    {
        "id": "q03", "category": "out-of-corpus", "query": "q3",
        "relevant_chunk_ids": [], "retrieved_chunk_ids": ["d"],
        "recall_at_3": None, "recall_at_5": None, "ndcg_at_5": None,
        "answer": "ans3", "judgment": {"faithful": True, "hallucinated_claims": [], "correctly_refused": True, "rationale": "ok"},
    },
]


def test_compute_aggregate_per_category_and_overall():
    agg = upload_snapshot.compute_aggregate(SAMPLE_RESULTS)

    single = agg["by_category"]["single-chunk"]
    assert single["n"] == 2
    assert single["recall_at_5_avg"] == 0.5
    assert single["ndcg_at_5_avg"] == 0.5
    assert single["faithful_rate"] == 0.5

    out_of_corpus = agg["by_category"]["out-of-corpus"]
    assert out_of_corpus["n"] == 1
    assert out_of_corpus["recall_at_5_avg"] is None  # no relevant_chunk_ids to score
    assert out_of_corpus["faithful_rate"] == 1.0

    overall = agg["overall"]
    assert overall["n"] == 3
    assert overall["faithful_rate"] == round(2 / 3, 4)


def test_build_snapshot_shape():
    snapshot = upload_snapshot.build_snapshot(
        SAMPLE_RESULTS, commit_sha="abc1234", commit_message="fix: thing", timestamp="2026-07-08T12:00:00"
    )
    assert snapshot["commit_sha"] == "abc1234"
    assert snapshot["commit_message"] == "fix: thing"
    assert snapshot["timestamp"] == "2026-07-08T12:00:00"
    assert snapshot["results"] == SAMPLE_RESULTS
    assert "aggregate" in snapshot


def test_upload_snapshot_puts_expected_key():
    mock_s3 = MagicMock()
    snapshot = {"timestamp": "2026-07-08T12:00:00", "commit_sha": "abc1234"}
    key = upload_snapshot.upload_snapshot(snapshot, bucket="test-bucket", s3_client=mock_s3)

    assert key == "synthetic/2026-07-08T12:00:00-abc1234.json"
    mock_s3.put_object.assert_called_once()
    call_kwargs = mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Bucket"] == "test-bucket"
    assert call_kwargs["Key"] == key
    assert call_kwargs["ContentType"] == "application/json"

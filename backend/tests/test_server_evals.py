import json
import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server
import retrieval

from fastapi.testclient import TestClient

client = TestClient(server.app)


def _fake_chunk(chunk_id="professional-summary"):
    return retrieval.Chunk(
        chunk_id=chunk_id,
        section_title="Professional Summary",
        text="Akash is an AI engineer.",
        embedding=[0.1, 0.2],
    )


def test_capture_live_eval_writes_expected_shape():
    mock_s3 = MagicMock()
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        server.capture_live_eval(
            query="What does Akash do?",
            retrieved_chunks=[(_fake_chunk(), 0.9)],
            answer="Akash is an AI engineer.",
        )

    mock_s3.put_object.assert_called_once()
    call_kwargs = mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Bucket"] == "test-evals-bucket"
    assert call_kwargs["Key"].startswith("live/raw/")
    assert call_kwargs["Key"].endswith(".json")
    body = json.loads(call_kwargs["Body"])
    assert body["query"] == "What does Akash do?"
    assert body["retrieved_chunk_ids"] == ["professional-summary"]
    assert "Akash is an AI engineer." in body["retrieved_text"]
    assert body["answer"] == "Akash is an AI engineer."
    assert "timestamp" in body


def test_capture_live_eval_noop_when_bucket_unset():
    mock_s3 = MagicMock()
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", ""):
        server.capture_live_eval(
            query="q", retrieved_chunks=[(_fake_chunk(), 0.9)], answer="a"
        )
    mock_s3.put_object.assert_not_called()


def test_capture_live_eval_failure_does_not_raise():
    mock_s3 = MagicMock()
    mock_s3.put_object.side_effect = Exception("S3 is down")
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        server.capture_live_eval(
            query="q", retrieved_chunks=[(_fake_chunk(), 0.9)], answer="a"
        )  # must not raise


def test_chat_endpoint_still_200s_when_capture_fails():
    fake_chunk = _fake_chunk()
    mock_s3 = MagicMock()
    mock_s3.put_object.side_effect = Exception("S3 is down")
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"), \
         patch.object(retrieval, "retrieve", return_value=[(fake_chunk, 0.9)]), \
         patch.object(server, "call_bedrock", return_value="Akash is an AI engineer."), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"):
        resp = client.post("/chat", json={"message": "What does Akash do?"})

    assert resp.status_code == 200


def test_get_evals_synthetic_returns_empty_list_when_no_objects():
    mock_s3 = MagicMock()
    mock_s3.get_paginator.return_value.paginate.return_value = [{"Contents": []}]
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        resp = client.get("/evals/synthetic")
    assert resp.status_code == 200
    assert resp.json() == {"snapshots": []}


def test_get_evals_synthetic_lists_snapshots_without_full_results():
    mock_s3 = MagicMock()
    mock_s3.get_paginator.return_value.paginate.return_value = [
        {"Contents": [{"Key": "synthetic/2026-07-08T12:00:00Z-abc1234.json"}]}
    ]
    snapshot_body = json.dumps({
        "timestamp": "2026-07-08T12:00:00Z", "commit_sha": "abc1234", "commit_message": "fix: x",
        "results": [{"id": "q01"}], "aggregate": {"overall": {"recall_at_5_avg": 0.9}},
    })
    mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: snapshot_body.encode())}
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        resp = client.get("/evals/synthetic")
    assert resp.status_code == 200
    snapshots = resp.json()["snapshots"]
    assert len(snapshots) == 1
    assert snapshots[0]["commit_sha"] == "abc1234"
    assert "results" not in snapshots[0]


def test_get_evals_synthetic_detail_returns_full_results():
    mock_s3 = MagicMock()
    snapshot_body = json.dumps({
        "timestamp": "2026-07-08T12:00:00Z", "commit_sha": "abc1234", "commit_message": "fix: x",
        "results": [{"id": "q01"}], "aggregate": {"overall": {"recall_at_5_avg": 0.9}},
    })
    mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: snapshot_body.encode())}
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        resp = client.get("/evals/synthetic/synthetic%2F2026-07-08T12%3A00%3A00Z-abc1234.json")
    assert resp.status_code == 200
    assert resp.json()["results"] == [{"id": "q01"}]


def test_get_evals_live_returns_empty_list_when_no_objects():
    mock_s3 = MagicMock()
    mock_s3.get_paginator.return_value.paginate.return_value = [{"Contents": []}]
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        resp = client.get("/evals/live")
    assert resp.status_code == 200
    assert resp.json() == {"entries": []}


def test_get_evals_live_lists_judged_entries():
    mock_s3 = MagicMock()
    mock_s3.get_paginator.return_value.paginate.return_value = [
        {"Contents": [{"Key": "live/judged/2026-07-08T12:00:00Z-uuid1.json"}]}
    ]
    entry_body = json.dumps({
        "timestamp": "2026-07-08T12:00:00Z", "query": "q", "retrieved_chunk_ids": ["a"],
        "retrieved_text": "t", "answer": "ans", "judgment": {"faithful": True},
    })
    mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: entry_body.encode())}
    with patch.object(server, "evals_s3_client", mock_s3), \
         patch.object(server, "EVALS_BUCKET", "test-evals-bucket"):
        resp = client.get("/evals/live")
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert len(entries) == 1
    assert entries[0]["judgment"] == {"faithful": True}

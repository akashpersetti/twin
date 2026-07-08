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

import json
import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "evals"))

import live_judge_handler


def _s3_event(bucket="twin-dev-evals-123", key="live/raw/2026-07-08T12:00:00Z-uuid1.json"):
    return {
        "Records": [
            {"s3": {"bucket": {"name": bucket}, "object": {"key": key}}}
        ]
    }


def test_process_record_writes_judged_output_on_success():
    mock_s3 = MagicMock()
    raw_body = json.dumps({
        "timestamp": "2026-07-08T12:00:00Z", "query": "q", "retrieved_chunk_ids": ["a"],
        "retrieved_text": "source text", "answer": "the answer",
    })
    mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: raw_body.encode())}
    fake_judgment = {"faithful": True, "hallucinated_claims": [], "correctly_refused": None, "rationale": "ok"}

    with patch.object(live_judge_handler.judge, "judge_answer", return_value=fake_judgment) as mock_judge:
        live_judge_handler.process_record("twin-dev-evals-123", "live/raw/2026-07-08T12:00:00Z-uuid1.json", mock_s3)

    mock_judge.assert_called_once_with("q", "source text", "the answer")
    mock_s3.put_object.assert_called_once()
    call_kwargs = mock_s3.put_object.call_args.kwargs
    assert call_kwargs["Bucket"] == "twin-dev-evals-123"
    assert call_kwargs["Key"] == "live/judged/2026-07-08T12:00:00Z-uuid1.json"
    written = json.loads(call_kwargs["Body"])
    assert written["judgment"] == fake_judgment
    assert written["query"] == "q"


def test_process_record_writes_error_marker_on_judge_failure():
    mock_s3 = MagicMock()
    raw_body = json.dumps({
        "timestamp": "2026-07-08T12:00:00Z", "query": "q", "retrieved_chunk_ids": [],
        "retrieved_text": "", "answer": "a",
    })
    mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: raw_body.encode())}

    with patch.object(live_judge_handler.judge, "judge_answer", side_effect=Exception("Bedrock timeout")):
        live_judge_handler.process_record("twin-dev-evals-123", "live/raw/2026-07-08T12:00:00Z-uuid1.json", mock_s3)

    call_kwargs = mock_s3.put_object.call_args.kwargs
    written = json.loads(call_kwargs["Body"])
    assert written["judgment_error"] == "Bedrock timeout"
    assert "judgment" not in written


def test_handler_processes_all_records_in_event():
    mock_s3_instance = MagicMock()
    raw_body = json.dumps({"timestamp": "t", "query": "q", "retrieved_chunk_ids": [], "retrieved_text": "", "answer": "a"})
    mock_s3_instance.get_object.return_value = {"Body": MagicMock(read=lambda: raw_body.encode())}

    with patch.object(live_judge_handler, "boto3") as mock_boto3, \
         patch.object(live_judge_handler.judge, "judge_answer", return_value={"faithful": True}):
        mock_boto3.client.return_value = mock_s3_instance
        live_judge_handler.handler(_s3_event(), None)

    mock_s3_instance.put_object.assert_called_once()

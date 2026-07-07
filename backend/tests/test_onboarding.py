import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import server as server_module
from server import app, build_bedrock_messages
import retrieval
from unittest.mock import patch
import pytest

client = TestClient(app)


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


def test_no_user_name_leaves_system_prompt_unchanged():
    msgs = build_bedrock_messages([], "hello")
    assert len(msgs) == 2
    assert "System:" in msgs[0]["content"][0]["text"]
    assert "visitor's name" not in msgs[0]["content"][0]["text"]
    assert msgs[-1]["content"][0]["text"] == "hello"


def test_user_name_is_appended_to_system_context():
    msgs = build_bedrock_messages([], "hello", user_name="Sarah")
    system_text = msgs[0]["content"][0]["text"]
    assert "Sarah" in system_text
    assert "visitor's name" in system_text


def test_greet_sentinel_with_name_is_replaced():
    msgs = build_bedrock_messages([], "__greet__", user_name="Sarah")
    last = msgs[-1]["content"][0]["text"]
    assert "__greet__" not in last
    assert "Sarah" in last


def test_greet_sentinel_without_name_is_replaced():
    msgs = build_bedrock_messages([], "__greet__")
    last = msgs[-1]["content"][0]["text"]
    assert "__greet__" not in last


def test_visitor_sends_sns_notification():
    with patch.object(server_module, "sns_client") as mock_sns, \
         patch.object(server_module, "SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789:twin-notifications"):

        resp = client.post("/visitor", json={"name": "Sarah", "contact": "sarah@email.com"})

        assert resp.status_code == 200
        mock_sns.publish.assert_called_once()
        kwargs = mock_sns.publish.call_args[1]
        assert kwargs["TopicArn"] == "arn:aws:sns:us-east-1:123456789:twin-notifications"
        assert "Sarah" in kwargs["Message"]
        assert "sarah@email.com" in kwargs["Message"]


def test_visitor_skips_sns_when_unconfigured():
    with patch.object(server_module, "sns_client") as mock_sns, \
         patch.object(server_module, "SNS_TOPIC_ARN", ""):

        resp = client.post("/visitor", json={"name": "Sarah"})

        assert resp.status_code == 200
        assert resp.json()["status"] == "skipped"
        mock_sns.publish.assert_not_called()


def test_visitor_contact_optional():
    with patch.object(server_module, "sns_client") as mock_sns, \
         patch.object(server_module, "SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789:twin-notifications"):

        resp = client.post("/visitor", json={"name": "Bob"})

        assert resp.status_code == 200
        kwargs = mock_sns.publish.call_args[1]
        assert "Bob" in kwargs["Message"]
        assert "(" not in kwargs["Message"]


def test_visitor_returns_ok_on_sns_failure():
    from botocore.exceptions import ClientError as BotoClientError
    error_response = {"Error": {"Code": "AuthorizationError", "Message": "Not authorized"}}
    with patch.object(server_module, "sns_client") as mock_sns, \
         patch.object(server_module, "SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789:twin-notifications"):

        mock_sns.publish.side_effect = BotoClientError(error_response, "Publish")
        resp = client.post("/visitor", json={"name": "Sarah"})

        assert resp.status_code == 200
        assert resp.json()["status"] in ("ok", "error")


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

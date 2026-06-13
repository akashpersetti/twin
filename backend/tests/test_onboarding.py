import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import server as server_module
from server import app, build_bedrock_messages

client = TestClient(app)


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


def test_visitor_sends_ses_email():
    with patch.object(server_module, "ses_client") as mock_ses, \
         patch.object(server_module, "SES_SENDER_EMAIL", "twin@akash.dev"), \
         patch.object(server_module, "NOTIFICATION_EMAIL", "akash@email.com"):

        resp = client.post("/visitor", json={"name": "Sarah", "contact": "sarah@email.com"})

        assert resp.status_code == 200
        mock_ses.send_email.assert_called_once()
        kwargs = mock_ses.send_email.call_args[1]
        assert kwargs["Source"] == "twin@akash.dev"
        body = kwargs["Message"]["Body"]["Text"]["Data"]
        assert "Sarah" in body
        assert "sarah@email.com" in body


def test_visitor_skips_ses_when_unconfigured():
    with patch.object(server_module, "ses_client") as mock_ses, \
         patch.object(server_module, "SES_SENDER_EMAIL", ""), \
         patch.object(server_module, "NOTIFICATION_EMAIL", ""):

        resp = client.post("/visitor", json={"name": "Sarah"})

        assert resp.status_code == 200
        assert resp.json()["status"] == "skipped"
        mock_ses.send_email.assert_not_called()


def test_visitor_contact_optional():
    with patch.object(server_module, "ses_client") as mock_ses, \
         patch.object(server_module, "SES_SENDER_EMAIL", "twin@akash.dev"), \
         patch.object(server_module, "NOTIFICATION_EMAIL", "akash@email.com"):

        resp = client.post("/visitor", json={"name": "Bob"})

        assert resp.status_code == 200
        kwargs = mock_ses.send_email.call_args[1]
        body = kwargs["Message"]["Body"]["Text"]["Data"]
        assert "Bob" in body
        assert "(" not in body  # no contact bracket

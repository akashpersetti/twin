import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server


def test_get_faq_returns_matching_entry():
    entry = server.get_faq(1)
    assert entry is not None
    assert entry["faq"] == 1
    assert "question" in entry
    assert "answer" in entry


def test_get_faq_returns_none_for_unknown_number():
    assert server.get_faq(999) is None


def test_match_faq_shortcut_matches_various_casing_and_whitespace():
    assert server.match_faq_shortcut("Q1")["faq"] == 1
    assert server.match_faq_shortcut("q1")["faq"] == 1
    assert server.match_faq_shortcut("  Q1  ")["faq"] == 1


def test_match_faq_shortcut_rejects_non_shortcut_text():
    assert server.match_faq_shortcut("Q1x") is None
    assert server.match_faq_shortcut("hello") is None
    assert server.match_faq_shortcut("Q") is None


def test_match_faq_shortcut_returns_none_for_unknown_number():
    assert server.match_faq_shortcut("Q999") is None


def test_match_faq_shortcut_returns_none_for_extremely_long_number():
    assert server.match_faq_shortcut("Q" + "9" * 5000) is None


from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

client = TestClient(server.app)


def test_chat_endpoint_answers_qn_shortcut_without_calling_bedrock():
    server._request_log.clear()
    with patch.object(server, "call_bedrock") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save:
        resp = client.post("/chat", json={"message": "Q1", "session_id": "faq-test-1"})
    assert resp.status_code == 200
    body = resp.json()
    faq_one = server.get_faq(1)
    assert body["response"] == f"**Q1:** {faq_one['question']}\n\n{faq_one['answer']}"
    mock_call_bedrock.assert_not_called()
    saved_conversation = mock_save.call_args.args[1]
    assert saved_conversation[-1]["content"] == body["response"]
    assert saved_conversation[-2]["content"] == "Q1"


def test_chat_endpoint_falls_through_for_unknown_qn():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value="hi") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server.retrieval, "retrieve", return_value=[]):
        resp = client.post("/chat", json={"message": "Q999", "session_id": "faq-test-2"})
    assert resp.status_code == 200
    mock_call_bedrock.assert_called_once()

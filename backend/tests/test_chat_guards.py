import os
import sys
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server

client = TestClient(server.app)


def test_clamp_message_leaves_short_message_unchanged():
    assert server.clamp_message("hello") == "hello"


def test_clamp_message_truncates_long_message_and_appends_notice():
    long_message = "a" * 25_000
    result = server.clamp_message(long_message)
    assert len(result) == len("a" * 20_000) + len(server.TRUNCATION_NOTICE)
    assert result.startswith("a" * 20_000)
    assert result.endswith(server.TRUNCATION_NOTICE)


def test_clamp_message_boundary_exactly_at_cap_is_unchanged():
    exact_message = "b" * 20_000
    assert server.clamp_message(exact_message) == exact_message


def test_check_rate_limit_allows_requests_under_cap():
    server._request_log.clear()
    for _ in range(20):
        server.check_rate_limit("session-a")  # must not raise


def test_check_rate_limit_rejects_21st_request_in_window():
    server._request_log.clear()
    for _ in range(20):
        server.check_rate_limit("session-b")
    with pytest.raises(Exception) as exc_info:
        server.check_rate_limit("session-b")
    assert exc_info.value.status_code == 429


def test_check_rate_limit_is_isolated_per_session():
    server._request_log.clear()
    for _ in range(20):
        server.check_rate_limit("session-c")
    server.check_rate_limit("session-d")  # different session, must not raise


def test_check_rate_limit_expires_old_entries():
    server._request_log.clear()
    with patch.object(time, "monotonic", return_value=1000.0):
        for _ in range(20):
            server.check_rate_limit("session-e")
    with patch.object(time, "monotonic", return_value=1000.0 + server.RATE_LIMIT_WINDOW_SECONDS + 1):
        server.check_rate_limit("session-e")  # window expired, must not raise


def test_check_scope_returns_true_for_on_topic_message():
    fake_response = {
        "output": {"message": {"content": [{"text": '{"on_topic": true, "reason": "career question"}'}]}}
    }
    with patch.object(server.bedrock_client, "converse", return_value=fake_response):
        assert server.check_scope([], "what's your experience with Python?") is True


def test_check_scope_returns_false_for_off_topic_message():
    fake_response = {
        "output": {"message": {"content": [{"text": '{"on_topic": false, "reason": "joke request"}'}]}}
    }
    with patch.object(server.bedrock_client, "converse", return_value=fake_response):
        assert server.check_scope([], "tell me a joke") is False


def test_check_scope_fails_open_when_bedrock_call_raises():
    with patch.object(server.bedrock_client, "converse", side_effect=Exception("throttled")):
        assert server.check_scope([], "anything") is True


def test_check_scope_uses_judge_model_and_recent_context():
    fake_response = {
        "output": {"message": {"content": [{"text": '{"on_topic": true, "reason": "ok"}'}]}}
    }
    conversation = [
        {"role": "user", "content": "tell me about your projects", "timestamp": "t1"},
        {"role": "assistant", "content": "Sure, here's one...", "timestamp": "t2"},
    ]
    with patch.object(server.bedrock_client, "converse", return_value=fake_response) as mock_converse:
        server.check_scope(conversation, "no need")
    call_kwargs = mock_converse.call_args.kwargs
    assert call_kwargs["modelId"] == server.JUDGE_MODEL_ID
    sent_text = call_kwargs["messages"][0]["content"][0]["text"]
    assert "no need" in sent_text
    assert "tell me about your projects" in sent_text


def _fake_messages(n):
    return [{"role": "user" if i % 2 == 0 else "assistant", "content": f"msg {i}"} for i in range(n)]


def test_check_session_cap_returns_none_under_hard_cap():
    assert server.check_session_cap(_fake_messages(29)) is None


def test_check_session_cap_returns_message_at_hard_cap():
    assert server.check_session_cap(_fake_messages(30)) == server.SESSION_CAP_MESSAGE


def test_check_session_cap_returns_message_above_hard_cap():
    assert server.check_session_cap(_fake_messages(45)) == server.SESSION_CAP_MESSAGE


def test_already_nudged_false_on_fresh_conversation():
    assert server.already_nudged(_fake_messages(10)) is False


def test_already_nudged_true_once_notice_present():
    conversation = _fake_messages(16)
    conversation.append({"role": "assistant", "content": f"Some reply.{server.SESSION_NUDGE_NOTICE}"})
    assert server.already_nudged(conversation) is True


def test_chat_endpoint_returns_429_when_rate_limited():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value="hi"), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server.retrieval, "retrieve", return_value=[]):
        for _ in range(20):
            resp = client.post("/chat", json={"message": "hello", "session_id": "rate-test"})
            assert resp.status_code == 200
        resp = client.post("/chat", json={"message": "hello", "session_id": "rate-test"})
    assert resp.status_code == 429
    assert "too quickly" in resp.json()["detail"]


def test_chat_endpoint_clamps_long_message_before_bedrock_call():
    server._request_log.clear()
    long_message = "x" * 25_000
    with patch.object(server, "call_bedrock", return_value="hi") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save, \
         patch.object(server, "check_scope", return_value=True), \
         patch.object(server.retrieval, "retrieve", return_value=[]):
        resp = client.post("/chat", json={"message": long_message, "session_id": "clamp-test"})
    assert resp.status_code == 200
    sent_message = mock_call_bedrock.call_args.args[1]
    assert len(sent_message) == 20_000 + len(server.TRUNCATION_NOTICE)
    saved_conversation = mock_save.call_args.args[1]
    stored_user_message = next(m["content"] for m in saved_conversation if m["role"] == "user")
    assert stored_user_message == sent_message


def test_chat_endpoint_skips_bedrock_when_off_topic():
    server._request_log.clear()
    with patch.object(server, "call_bedrock") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server, "check_scope", return_value=False):
        resp = client.post("/chat", json={"message": "tell me a joke", "session_id": "scope-test"})
    assert resp.status_code == 200
    assert resp.json()["response"] == server.SCOPE_DEFLECTION
    mock_call_bedrock.assert_not_called()


def test_chat_endpoint_skips_bedrock_at_hard_cap():
    server._request_log.clear()
    full_conversation = _fake_messages(30)
    with patch.object(server, "call_bedrock") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=full_conversation), \
         patch.object(server, "save_conversation"):
        resp = client.post("/chat", json={"message": "one more thing", "session_id": "cap-test"})
    assert resp.status_code == 200
    assert resp.json()["response"] == server.SESSION_CAP_MESSAGE
    mock_call_bedrock.assert_not_called()


def test_chat_endpoint_appends_nudge_once_past_threshold():
    server._request_log.clear()
    conversation_at_threshold = _fake_messages(15)
    with patch.object(server, "call_bedrock", return_value=("Here's my answer.", False)), \
         patch.object(server, "load_conversation", return_value=conversation_at_threshold), \
         patch.object(server, "save_conversation"), \
         patch.object(server, "check_scope", return_value=True):
        resp = client.post("/chat", json={"message": "tell me more", "session_id": "nudge-test"})
    assert resp.json()["response"] == "Here's my answer." + server.SESSION_NUDGE_NOTICE

    conversation_already_nudged = _fake_messages(17)
    conversation_already_nudged.append(
        {"role": "assistant", "content": f"Earlier reply.{server.SESSION_NUDGE_NOTICE}"}
    )
    with patch.object(server, "call_bedrock", return_value=("Another answer.", False)), \
         patch.object(server, "load_conversation", return_value=conversation_already_nudged), \
         patch.object(server, "save_conversation"), \
         patch.object(server, "check_scope", return_value=True):
        resp = client.post("/chat", json={"message": "and more", "session_id": "nudge-test-2"})
    assert resp.json()["response"] == "Another answer."


def test_chat_endpoint_rate_limit_short_circuits_before_scope_check():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value=("hi", False)), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server, "check_scope") as mock_check_scope:
        for _ in range(20):
            resp = client.post("/chat", json={"message": "hello", "session_id": "rate-vs-scope-test"})
            assert resp.status_code == 200
        resp = client.post("/chat", json={"message": "hello", "session_id": "rate-vs-scope-test"})
    assert resp.status_code == 429
    assert mock_check_scope.call_count == 20

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
         patch.object(server.retrieval, "retrieve", return_value=[]):
        resp = client.post("/chat", json={"message": long_message, "session_id": "clamp-test"})
    assert resp.status_code == 200
    sent_message = mock_call_bedrock.call_args.args[1]
    assert len(sent_message) == 20_000 + len(server.TRUNCATION_NOTICE)
    saved_conversation = mock_save.call_args.args[1]
    stored_user_message = next(m["content"] for m in saved_conversation if m["role"] == "user")
    assert stored_user_message == sent_message

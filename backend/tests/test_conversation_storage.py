import json
import os
import sys
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server

client = TestClient(server.app)


def test_save_conversation_dynamodb_computes_aggregates_and_puts_item():
    mock_table = MagicMock()
    messages = [
        {"role": "user", "content": "hi", "timestamp": "2026-01-01T00:00:00", "needs_attention": False, "read": True},
        {"role": "assistant", "content": "hello", "timestamp": "2026-01-01T00:00:05", "needs_attention": True, "read": False},
    ]
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        server.save_conversation("session-a", messages)

    mock_table.put_item.assert_called_once()
    item = mock_table.put_item.call_args.kwargs["Item"]
    assert item["conversation_id"] == "session-a"
    assert item["messages"] == messages
    assert item["gsi_pk"] == "CONVO"
    assert item["last_activity"] == "2026-01-01T00:00:05"
    assert item["needs_attention"] is True
    assert item["unread_count"] == 1


def test_save_conversation_dynamodb_handles_empty_messages():
    mock_table = MagicMock()
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        server.save_conversation("session-empty", [])
    item = mock_table.put_item.call_args.kwargs["Item"]
    assert item["needs_attention"] is False
    assert item["unread_count"] == 0


def test_load_conversation_dynamodb_returns_empty_list_when_no_item():
    mock_table = MagicMock()
    mock_table.get_item.return_value = {}
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        assert server.load_conversation("session-missing") == []


def test_load_conversation_dynamodb_returns_stored_messages():
    mock_table = MagicMock()
    stored_messages = [{"role": "user", "content": "hi", "timestamp": "t", "needs_attention": False, "read": False}]
    mock_table.get_item.return_value = {"Item": {"conversation_id": "session-b", "messages": stored_messages}}
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        assert server.load_conversation("session-b") == stored_messages


def test_save_conversation_local_file_updates_index(tmp_path):
    messages = [
        {"role": "user", "content": "hi", "timestamp": "2026-01-01T00:00:00", "needs_attention": False, "read": True},
        {"role": "assistant", "content": "hello", "timestamp": "2026-01-01T00:00:05", "needs_attention": True, "read": False},
    ]
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        server.save_conversation("session-local-1", messages)

        index_path = tmp_path / "conversations_index.json"
        assert index_path.exists()
        index = json.loads(index_path.read_text())
        assert index["session-local-1"]["last_activity"] == "2026-01-01T00:00:05"
        assert index["session-local-1"]["needs_attention"] is True
        assert index["session-local-1"]["unread_count"] == 1

        assert server.load_conversation("session-local-1") == messages


def test_save_conversation_local_file_index_preserves_other_conversations(tmp_path):
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        server.save_conversation("session-x", [{"role": "user", "content": "a", "timestamp": "t1", "needs_attention": False, "read": False}])
        server.save_conversation("session-y", [{"role": "user", "content": "b", "timestamp": "t2", "needs_attention": False, "read": False}])

        index_path = tmp_path / "conversations_index.json"
        index = json.loads(index_path.read_text())
        assert "session-x" in index
        assert "session-y" in index


def test_chat_endpoint_saves_messages_with_needs_attention_and_read_defaults():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value=("hi", False)), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save, \
         patch.object(server.retrieval, "retrieve", return_value=[]):
        client.post("/chat", json={"message": "hello", "session_id": "defaults-test"})
    saved_conversation = mock_save.call_args.args[1]
    assert len(saved_conversation) == 2
    for msg in saved_conversation:
        assert msg["needs_attention"] is False
        assert msg["read"] is False


def test_chat_endpoint_faq_shortcut_saves_messages_with_needs_attention_and_read_defaults():
    server._request_log.clear()
    with patch.object(server, "call_bedrock") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save:
        client.post("/chat", json={"message": "Q1", "session_id": "defaults-test-faq"})
    mock_call_bedrock.assert_not_called()
    saved_conversation = mock_save.call_args.args[1]
    assert len(saved_conversation) == 2
    for msg in saved_conversation:
        assert msg["needs_attention"] is False
        assert msg["read"] is False

import json
import os
import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server

client = TestClient(server.app)
get_controlled_by = server.get_controlled_by


@pytest.fixture(autouse=True)
def bot_controlled_by_default():
    with patch.object(server, "get_controlled_by", return_value="bot"):
        yield


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
    assert item["preview"] == "hello"


def test_save_conversation_dynamodb_handles_empty_messages():
    mock_table = MagicMock()
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        server.save_conversation("session-empty", [])
    item = mock_table.put_item.call_args.kwargs["Item"]
    assert item["needs_attention"] is False
    assert item["unread_count"] == 0
    assert item["preview"] == ""


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
        assert index["session-local-1"]["preview"] == "hello"

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


def test_get_controlled_by_defaults_to_bot_when_dynamodb_item_missing():
    mock_table = MagicMock()
    mock_table.get_item.return_value = {}
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        assert get_controlled_by("session-missing") == "bot"


def test_get_controlled_by_reads_dynamodb_item():
    mock_table = MagicMock()
    mock_table.get_item.return_value = {"Item": {"conversation_id": "session-h", "controlled_by": "human"}}
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        assert get_controlled_by("session-h") == "human"


def test_get_controlled_by_defaults_to_bot_for_invalid_dynamodb_value():
    mock_table = MagicMock()
    mock_table.get_item.return_value = {"Item": {"conversation_id": "session-invalid", "controlled_by": "operator"}}
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        assert get_controlled_by("session-invalid") == "bot"


def test_get_controlled_by_defaults_to_bot_for_s3():
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", True):
        assert get_controlled_by("any-session") == "bot"


def test_get_controlled_by_reads_local_index(tmp_path):
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        server.save_conversation(
            "session-local-human",
            [{"role": "human", "content": "hi", "timestamp": "t1", "needs_attention": False, "read": True}],
            "human",
        )
        assert get_controlled_by("session-local-human") == "human"
        assert get_controlled_by("session-never-saved") == "bot"


def test_save_conversation_dynamodb_persists_controlled_by():
    mock_table = MagicMock()
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        server.save_conversation("session-c", [], "human")
    item = mock_table.put_item.call_args.kwargs["Item"]
    assert item["controlled_by"] == "human"


def test_save_conversation_defaults_invalid_controlled_by_to_bot():
    mock_table = MagicMock()
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        server.save_conversation("session-invalid", [], "operator")
    item = mock_table.put_item.call_args.kwargs["Item"]
    assert item["controlled_by"] == "bot"


def test_save_conversation_defaults_controlled_by_to_bot():
    mock_table = MagicMock()
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        server.save_conversation("session-d", [])
    item = mock_table.put_item.call_args.kwargs["Item"]
    assert item["controlled_by"] == "bot"


def test_save_conversation_local_file_index_stores_controlled_by(tmp_path):
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        server.save_conversation("session-local-2", [{"role": "user", "content": "hi", "timestamp": "t", "needs_attention": False, "read": False}], "human")

        index_path = tmp_path / "conversations_index.json"
        index = json.loads(index_path.read_text())
        assert index["session-local-2"]["controlled_by"] == "human"


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

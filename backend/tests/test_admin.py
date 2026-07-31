import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

import server
import auth as auth_module

VALID_TOKEN = "test-secret-admin-token"

client = TestClient(server.app)


@pytest.fixture(autouse=True)
def bot_controlled_by_default():
    with patch.object(server, "get_controlled_by", return_value="bot"):
        yield


@pytest.fixture(autouse=True)
def reset_admin_token():
    auth_module._admin_token = VALID_TOKEN
    yield
    auth_module._admin_token = None


def auth_headers():
    return {"Authorization": f"Bearer {VALID_TOKEN}"}


# ── Auth ──────────────────────────────────────────────────────────────────────

def test_admin_auth_request_hides_non_owner_email():
    with patch.object(auth_module, "magic_tokens_table", create=True) as table, \
         patch.object(auth_module, "ses", create=True) as mock_ses:
        response = client.post("/admin/auth/request", json={"email": "other@example.com"})

    assert response.status_code == 200
    assert response.json() == {"sent": True}
    table.put_item.assert_not_called()
    mock_ses.send_email.assert_not_called()


def test_admin_auth_request_stores_token_and_sends_email():
    token = "b" * 64
    with patch.object(auth_module, "magic_tokens_table", create=True) as table, \
         patch.object(auth_module, "ses", create=True) as mock_ses, \
         patch("secrets.token_hex", return_value=token), \
         patch("time.time", return_value=1_000):
        response = client.post("/admin/auth/request", json={"email": "ahadagal@alumni.iu.edu"})

    assert response.status_code == 200
    assert response.json() == {"sent": True}
    table.put_item.assert_called_once_with(Item={"token": token, "expires_at": 1_900})
    email = mock_ses.send_email.call_args.kwargs
    assert email["Source"] == "akash.hp@icloud.com"
    assert email["Destination"] == {"ToAddresses": ["ahadagal@alumni.iu.edu"]}
    link = f"https://akashpersetti.com/admin?magic={token}"
    assert link in email["Message"]["Body"]["Text"]["Data"]
    assert link in email["Message"]["Body"]["Html"]["Data"]


def test_admin_auth_verify_consumes_valid_token():
    with patch.object(auth_module, "magic_tokens_table") as table, \
         patch("time.time", return_value=1_000):
        table.get_item.return_value = {"Item": {"token": "valid", "expires_at": 1_001}}
        response = client.get("/admin/auth/verify?token=valid")

    assert response.status_code == 200
    assert response.json() == {"admin_token": VALID_TOKEN}
    table.delete_item.assert_called_once_with(
        Key={"token": "valid"},
        ConditionExpression="attribute_exists(#token)",
        ExpressionAttributeNames={"#token": "token"},
    )


def test_admin_auth_verify_rejects_unknown_token():
    with patch.object(auth_module, "magic_tokens_table") as table:
        table.get_item.return_value = {}
        response = client.get("/admin/auth/verify?token=unknown")

    assert response.status_code == 401


def test_admin_endpoint_missing_token_returns_401():
    response = client.get("/admin/conversations")
    assert response.status_code == 401


def test_admin_endpoint_wrong_token_returns_401():
    response = client.get("/admin/conversations", headers={"Authorization": "Bearer wrong"})
    assert response.status_code == 401


def test_list_conversations_dynamodb_sorted_by_recency():
    mock_table = MagicMock()
    mock_table.query.return_value = {
        "Items": [
            {"conversation_id": "c1", "last_activity": "2026-02-01T00:00:00", "needs_attention": False, "unread_count": 0, "preview": "hi"},
            {"conversation_id": "c2", "last_activity": "2026-01-01T00:00:00", "needs_attention": True, "unread_count": 2, "preview": "help"},
        ]
    }
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        response = client.get("/admin/conversations", headers=auth_headers())

    assert response.status_code == 200
    conversations = response.json()["conversations"]
    assert [c["conversation_id"] for c in conversations] == ["c1", "c2"]
    assert conversations[1]["needs_attention"] is True


def test_list_conversations_local_index_sorted_by_recency(tmp_path):
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        server.save_conversation("c-old", [{"role": "user", "content": "a", "timestamp": "2026-01-01T00:00:00", "needs_attention": False, "read": False}])
        server.save_conversation("c-new", [{"role": "user", "content": "b", "timestamp": "2026-02-01T00:00:00", "needs_attention": False, "read": False}])

        response = client.get("/admin/conversations", headers=auth_headers())

    assert response.status_code == 200
    conversations = response.json()["conversations"]
    assert [c["conversation_id"] for c in conversations] == ["c-new", "c-old"]


def test_list_conversations_dynamodb_includes_controlled_by():
    mock_table = MagicMock()
    mock_table.query.return_value = {
        "Items": [
            {"conversation_id": "c1", "last_activity": "2026-02-01T00:00:00", "needs_attention": False, "unread_count": 0, "preview": "hi", "controlled_by": "human"},
            {"conversation_id": "c2", "last_activity": "2026-01-01T00:00:00", "needs_attention": False, "unread_count": 0, "preview": "hi"},
        ]
    }
    with patch.object(server, "USE_DYNAMODB", True), \
         patch.object(server, "conversations_table", mock_table, create=True):
        response = client.get("/admin/conversations", headers=auth_headers())

    conversations = response.json()["conversations"]
    assert conversations[0]["controlled_by"] == "human"
    assert conversations[1]["controlled_by"] == "bot"


def test_list_conversations_local_index_includes_controlled_by(tmp_path):
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        server.save_conversation("c-human", [{"role": "human", "content": "a", "timestamp": "2026-01-01T00:00:00", "needs_attention": False, "read": True}], "human")

        response = client.get("/admin/conversations", headers=auth_headers())

    conversations = response.json()["conversations"]
    assert conversations[0]["controlled_by"] == "human"


def test_list_conversations_local_legacy_index_defaults_controlled_by_to_bot(tmp_path):
    with patch.object(server, "USE_DYNAMODB", False), \
         patch.object(server, "USE_S3", False), \
         patch.object(server, "MEMORY_DIR", str(tmp_path)):
        tmp_path.joinpath("conversations_index.json").write_text(json.dumps({
            "c-legacy": {
                "last_activity": "2026-01-01T00:00:00",
                "needs_attention": False,
                "unread_count": 0,
                "preview": "legacy",
            }
        }))

        response = client.get("/admin/conversations", headers=auth_headers())

    conversations = response.json()["conversations"]
    assert conversations[0]["controlled_by"] == "bot"


def test_get_conversation_marks_read_and_clears_needs_attention():
    messages = [
        {"role": "user", "content": "hi", "timestamp": "t1", "needs_attention": False, "read": False},
        {"role": "assistant", "content": "hello", "timestamp": "t2", "needs_attention": True, "read": False},
    ]
    with patch.object(server, "load_conversation", return_value=messages), \
         patch.object(server, "save_conversation") as mock_save:
        response = client.get("/admin/conversations/convo-1", headers=auth_headers())

    assert response.status_code == 200
    body = response.json()
    assert all(m["read"] is True for m in body["messages"])
    assert all(m["needs_attention"] is False for m in body["messages"])
    saved = mock_save.call_args.args[1]
    assert all(m["read"] is True and m["needs_attention"] is False for m in saved)


def test_get_conversation_404_when_unknown():
    with patch.object(server, "load_conversation", return_value=[]):
        response = client.get("/admin/conversations/unknown-convo", headers=auth_headers())
    assert response.status_code == 404


def test_post_human_message_appends_and_does_not_call_bedrock():
    with patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save, \
         patch.object(server, "call_bedrock") as mock_call_bedrock:
        response = client.post(
            "/admin/conversations/convo-2/messages",
            json={"content": "This is Akash, happy to help!"},
            headers=auth_headers(),
        )

    assert response.status_code == 200
    mock_call_bedrock.assert_not_called()
    saved = mock_save.call_args.args[1]
    assert saved[-1]["role"] == "human"
    assert saved[-1]["content"] == "This is Akash, happy to help!"
    assert saved[-1]["read"] is True
    assert saved[-1]["needs_attention"] is False


def test_post_human_message_sets_controlled_by_human():
    with patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save:
        response = client.post(
            "/admin/conversations/convo-3/messages",
            json={"content": "Taking over now."},
            headers=auth_headers(),
        )

    assert response.status_code == 200
    assert response.json()["controlled_by"] == "human"
    assert mock_save.call_args.args[2] == "human"


def test_get_admin_conversation_preserves_controlled_by_on_resave():
    messages = [{"role": "human", "content": "hi", "timestamp": "t1", "needs_attention": False, "read": False}]
    with patch.object(server, "load_conversation", return_value=messages), \
         patch.object(server, "get_controlled_by", return_value="human"), \
         patch.object(server, "save_conversation") as mock_save:
        response = client.get("/admin/conversations/convo-4", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["controlled_by"] == "human"
    assert mock_save.call_args.args[2] == "human"


def test_return_control_appends_system_message_and_flips_to_bot():
    messages = [{"role": "human", "content": "hi", "timestamp": "t1", "needs_attention": False, "read": True}]
    with patch.object(server, "load_conversation", return_value=messages), \
         patch.object(server, "save_conversation") as mock_save:
        response = client.post("/admin/conversations/convo-5/return-control", headers=auth_headers())

    assert response.status_code == 200
    body = response.json()
    assert body["controlled_by"] == "bot"
    assert body["messages"][-1]["role"] == "system"
    assert body["messages"][-1]["content"] == "You're now chatting with the assistant again."

    saved_conversation = mock_save.call_args.args[1]
    assert saved_conversation[-1]["role"] == "system"
    assert mock_save.call_args.args[2] == "bot"


def test_return_control_404_when_unknown():
    with patch.object(server, "load_conversation", return_value=[]):
        response = client.post("/admin/conversations/unknown-convo/return-control", headers=auth_headers())
    assert response.status_code == 404


def test_return_control_requires_auth():
    assert client.post("/admin/conversations/x/return-control").status_code == 401


def test_admin_endpoints_401_without_token():
    assert client.get("/admin/conversations").status_code == 401
    assert client.get("/admin/conversations/x").status_code == 401
    assert client.post("/admin/conversations/x/messages", json={"content": "hi"}).status_code == 401

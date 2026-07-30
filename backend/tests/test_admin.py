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

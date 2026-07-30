import json
from urllib.error import HTTPError
from unittest.mock import MagicMock, patch

import pytest

import telegram_handler


@pytest.fixture(autouse=True)
def telegram_config(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN_PARAMETER", "/twin/test/telegram-bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "123456789")
    monkeypatch.setenv("TELEGRAM_ADMIN_URL", "https://akashpersetti.com/admin")
    telegram_handler._BOT_TOKEN = None
    yield
    telegram_handler._BOT_TOKEN = None


def sns_event(*records):
    return {
        "Records": [
            {"Sns": {"Subject": subject, "Message": message}}
            for subject, message in records
        ]
    }


def telegram_response(payload=b'{"ok": true, "result": {"message_id": 1}}'):
    response = MagicMock()
    response.status = 200
    response.read.return_value = payload
    return response


def test_handler_sends_each_sns_record_and_caches_token():
    with patch.object(telegram_handler.ssm_client, "get_parameter") as get_parameter, \
         patch.object(telegram_handler.request, "urlopen") as urlopen:
        get_parameter.return_value = {"Parameter": {"Value": "bot-token"}}
        urlopen.return_value.__enter__.return_value = telegram_response()

        result = telegram_handler.handler(
            sns_event(
                ("Digital twin interaction", "Sarah interacted with your digital twin"),
                ("Visitor needs help", "Open the conversation in the admin panel"),
            ),
            None,
        )

    assert result == {"delivered": 2}
    get_parameter.assert_called_once_with(
        Name="/twin/test/telegram-bot-token",
        WithDecryption=True,
    )
    assert urlopen.call_count == 2

    first_request = urlopen.call_args_list[0].args[0]
    first_payload = json.loads(first_request.data)
    assert first_request.full_url == "https://api.telegram.org/botbot-token/sendMessage"
    assert first_payload["chat_id"] == "123456789"
    assert first_payload["text"] == (
        "Digital twin interaction\n\nSarah interacted with your digital twin"
    )
    assert first_payload["reply_markup"] == {
        "inline_keyboard": [[{
            "text": "Open admin panel",
            "url": "https://akashpersetti.com/admin",
        }]]
    }


@pytest.mark.parametrize(
    "event",
    [
        {},
        {"Records": []},
        {"Records": [{}]},
        {"Records": [{"Sns": {"Subject": "Missing message"}}]},
    ],
)
def test_handler_rejects_malformed_sns_events(event):
    with pytest.raises(ValueError):
        telegram_handler.handler(event, None)


@pytest.mark.parametrize(
    "missing_name",
    ["TELEGRAM_BOT_TOKEN_PARAMETER", "TELEGRAM_CHAT_ID", "TELEGRAM_ADMIN_URL"],
)
def test_handler_rejects_missing_configuration(monkeypatch, missing_name):
    monkeypatch.delenv(missing_name)

    with pytest.raises(RuntimeError, match="Telegram notifier is not configured"):
        telegram_handler.handler(
            sns_event(("Subject", "Message")),
            None,
        )


def test_handler_raises_when_telegram_rejects_message():
    with patch.object(telegram_handler.ssm_client, "get_parameter") as get_parameter, \
         patch.object(telegram_handler.request, "urlopen") as urlopen:
        get_parameter.return_value = {"Parameter": {"Value": "bot-token"}}
        urlopen.return_value.__enter__.return_value = telegram_response(
            b'{"ok": false, "description": "Bad Request"}'
        )

        with pytest.raises(RuntimeError, match="Telegram rejected the notification"):
            telegram_handler.handler(sns_event(("Subject", "Message")), None)


def test_handler_raises_on_non_2xx_response():
    http_error = HTTPError(
        "https://api.telegram.org/redacted",
        500,
        "Internal Server Error",
        None,
        None,
    )
    with patch.object(telegram_handler.ssm_client, "get_parameter") as get_parameter, \
         patch.object(telegram_handler.request, "urlopen", side_effect=http_error):
        get_parameter.return_value = {"Parameter": {"Value": "bot-token"}}

        with pytest.raises(RuntimeError, match="Telegram notification delivery failed"):
            telegram_handler.handler(sns_event(("Subject", "Message")), None)


def test_handler_raises_on_returned_non_2xx_response_even_when_telegram_accepts():
    with patch.object(telegram_handler.ssm_client, "get_parameter") as get_parameter, \
         patch.object(telegram_handler.request, "urlopen") as urlopen:
        get_parameter.return_value = {"Parameter": {"Value": "bot-token"}}
        urlopen.return_value.__enter__.return_value = telegram_response()
        urlopen.return_value.__enter__.return_value.status = 500

        with pytest.raises(RuntimeError, match="Telegram notification delivery failed"):
            telegram_handler.handler(sns_event(("Subject", "Message")), None)


def test_handler_raises_on_malformed_telegram_json():
    with patch.object(telegram_handler.ssm_client, "get_parameter") as get_parameter, \
         patch.object(telegram_handler.request, "urlopen") as urlopen:
        get_parameter.return_value = {"Parameter": {"Value": "bot-token"}}
        urlopen.return_value.__enter__.return_value = telegram_response(b"not json")

        with pytest.raises(RuntimeError, match="Telegram notification delivery failed"):
            telegram_handler.handler(sns_event(("Subject", "Message")), None)


def test_handler_hides_token_when_delivery_fails():
    with patch.object(telegram_handler.ssm_client, "get_parameter") as get_parameter, \
         patch.object(telegram_handler.request, "urlopen", side_effect=OSError("offline")):
        get_parameter.return_value = {"Parameter": {"Value": "secret-bot-token"}}

        with pytest.raises(RuntimeError) as error:
            telegram_handler.handler(sns_event(("Subject", "Message")), None)

    assert "secret-bot-token" not in str(error.value)

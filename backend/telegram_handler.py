import json
import os
from urllib import request

import boto3


ssm_client = boto3.client(
    "ssm",
    region_name=os.getenv(
        "AWS_DEFAULT_REGION",
        os.getenv("DEFAULT_AWS_REGION", "us-east-1"),
    ),
)
_BOT_TOKEN = None


def _config(name):
    value = os.getenv(name, "")
    if not value:
        raise RuntimeError("Telegram notifier is not configured")
    return value


def _get_bot_token():
    global _BOT_TOKEN
    if _BOT_TOKEN is None:
        response = ssm_client.get_parameter(
            Name=_config("TELEGRAM_BOT_TOKEN_PARAMETER"),
            WithDecryption=True,
        )
        _BOT_TOKEN = response["Parameter"]["Value"]
    return _BOT_TOKEN


def _notification(record):
    try:
        sns = record["Sns"]
        message = sns["Message"]
    except (KeyError, TypeError) as error:
        raise ValueError("Malformed SNS notification") from error

    if not isinstance(message, str) or not message:
        raise ValueError("Malformed SNS notification")

    subject = sns.get("Subject") or "Digital twin notification"
    if not isinstance(subject, str):
        raise ValueError("Malformed SNS notification")
    return subject, message


def _send_message(subject, message):
    chat_id = _config("TELEGRAM_CHAT_ID")
    admin_url = _config("TELEGRAM_ADMIN_URL")
    token = _get_bot_token()
    payload = json.dumps({
        "chat_id": chat_id,
        "text": f"{subject}\n\n{message}",
        "reply_markup": {
            "inline_keyboard": [[{
                "text": "Open admin panel",
                "url": admin_url,
            }]],
        },
    }).encode("utf-8")
    telegram_request = request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(telegram_request, timeout=10) as response:
            result = json.loads(response.read())
    except Exception:
        raise RuntimeError("Telegram notification delivery failed") from None

    if not result.get("ok"):
        raise RuntimeError("Telegram rejected the notification")


def handler(event, context):
    records = event.get("Records") if isinstance(event, dict) else None
    if not isinstance(records, list) or not records:
        raise ValueError("Malformed SNS notification")

    for record in records:
        subject, message = _notification(record)
        _send_message(subject, message)

    return {"delivered": len(records)}

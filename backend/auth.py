import os
import time
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import Header, HTTPException

AWS_REGION = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-2"))
SSM_ADMIN_TOKEN_PARAM = "/twin/dev/blog-admin-token"
MAGIC_TOKEN_TABLE = os.getenv("MAGIC_TOKEN_TABLE", "twin-dev-magic-tokens")
MAGIC_TOKEN_TTL_SECONDS = 15 * 60
OWNER_EMAIL = "ahadagal@alumni.iu.edu"
SES_SENDER_EMAIL = "akash.hp@icloud.com"

ssm = boto3.client("ssm", region_name=AWS_REGION)
_dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
magic_tokens_table = _dynamodb.Table(MAGIC_TOKEN_TABLE)
ses = boto3.client("ses", region_name=AWS_REGION)

_admin_token: Optional[str] = None


def get_admin_token() -> str:
    global _admin_token
    if _admin_token is None:
        _admin_token = ssm.get_parameter(
            Name=SSM_ADMIN_TOKEN_PARAM, WithDecryption=True
        )["Parameter"]["Value"]
    return _admin_token


def verify_token(authorization: str = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    if authorization.split(" ", 1)[1] != get_admin_token():
        raise HTTPException(status_code=401, detail="Invalid token")


def _invalid_magic_token():
    raise HTTPException(status_code=401, detail="Invalid or expired magic link")


def consume_magic_token(token: Optional[str]) -> None:
    """Validate and consume a magic-link token, or raise HTTPException(401)."""
    if not token:
        _invalid_magic_token()

    item = magic_tokens_table.get_item(Key={"token": token}, ConsistentRead=True).get("Item")
    if not item:
        _invalid_magic_token()

    try:
        expires_at = int(item["expires_at"])
    except (KeyError, TypeError, ValueError):
        magic_tokens_table.delete_item(Key={"token": token})
        _invalid_magic_token()
        return

    if expires_at <= int(time.time()):
        magic_tokens_table.delete_item(Key={"token": token})
        _invalid_magic_token()
        return

    try:
        magic_tokens_table.delete_item(
            Key={"token": token},
            ConditionExpression="attribute_exists(#token)",
            ExpressionAttributeNames={"#token": "token"},
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            _invalid_magic_token()
            return
        raise

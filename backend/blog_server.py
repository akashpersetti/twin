import json
import os
import re
import secrets
import time
import urllib.error
import urllib.request
from datetime import date
from typing import Optional

import boto3
import yaml
from botocore.exceptions import ClientError
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config from env
BLOG_CONTENT_BUCKET = os.getenv("BLOG_CONTENT_BUCKET", "")
GITHUB_REPO = os.getenv("GITHUB_REPO", "akashpersetti/twin")
AWS_REGION = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-2"))

SSM_ADMIN_TOKEN_PARAM = "/twin/dev/blog-admin-token"
SSM_GITHUB_PAT_PARAM = "/twin/dev/github-pat"
OWNER_EMAIL = "ahadagal@alumni.iu.edu"
SES_SENDER_EMAIL = "akash.hp@icloud.com"
MAGIC_LINK_BASE_URL = "https://akashpersetti.com/blog"
MAGIC_TOKEN_TTL_SECONDS = 15 * 60
MAGIC_TOKEN_TABLE = os.getenv("MAGIC_TOKEN_TABLE", "twin-dev-magic-tokens")

ssm = boto3.client("ssm", region_name=AWS_REGION)
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
magic_tokens_table = dynamodb.Table(MAGIC_TOKEN_TABLE)
ses = boto3.client("ses", region_name=AWS_REGION)

# Cached at Lambda cold start
_admin_token: Optional[str] = None
_github_pat: Optional[str] = None


def get_admin_token() -> str:
    global _admin_token
    if _admin_token is None:
        _admin_token = ssm.get_parameter(
            Name=SSM_ADMIN_TOKEN_PARAM, WithDecryption=True
        )["Parameter"]["Value"]
    return _admin_token


def get_github_pat() -> str:
    global _github_pat
    if _github_pat is None:
        _github_pat = ssm.get_parameter(
            Name=SSM_GITHUB_PAT_PARAM, WithDecryption=True
        )["Parameter"]["Value"]
    return _github_pat


def verify_token(authorization: str = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    if authorization.split(" ", 1)[1] != get_admin_token():
        raise HTTPException(status_code=401, detail="Invalid token")


def trigger_blog_rebuild():
    """Fire-and-forget GitHub Actions repository_dispatch."""
    pat = get_github_pat()
    data = json.dumps({"event_type": "blog-deploy"}).encode()
    req = urllib.request.Request(
        f"https://api.github.com/repos/{GITHUB_REPO}/dispatches",
        data=data,
        headers={
            "Authorization": f"Bearer {pat}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:
        print(f"GitHub dispatch failed: {exc}")


# ── Frontmatter helpers ───────────────────────────────────────────────────────

def parse_frontmatter(content: str) -> tuple[dict, str]:
    match = re.match(r"^---\n(.*?)\n---\n?(.*)", content, re.DOTALL)
    if not match:
        return {}, content
    return yaml.safe_load(match.group(1)) or {}, match.group(2).strip()


def serialize_post(meta: dict, body: str) -> str:
    fm = yaml.dump(meta, default_flow_style=False, allow_unicode=True, sort_keys=False).strip()
    return f"---\n{fm}\n---\n\n{body}\n"


def find_post_key(slug: str) -> Optional[str]:
    """Return S3 key (drafts/ or published/) or None if not found."""
    for prefix in ["drafts/", "published/"]:
        key = f"{prefix}{slug}.md"
        try:
            s3.head_object(Bucket=BLOG_CONTENT_BUCKET, Key=key)
            return key
        except ClientError as e:
            if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                continue
            raise
    return None


def read_post(key: str) -> tuple[dict, str]:
    body = s3.get_object(Bucket=BLOG_CONTENT_BUCKET, Key=key)["Body"].read().decode()
    return parse_frontmatter(body)


# ── Request/Response models ───────────────────────────────────────────────────

class CreatePostRequest(BaseModel):
    title: str
    slug: str
    summary: str
    tags: list[str]
    date: str
    body: str


class UpdatePostRequest(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[list[str]] = None
    body: Optional[str] = None


class DeleteRequest(BaseModel):
    confirm: bool = False


class MagicLinkRequest(BaseModel):
    email: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/auth/request")
def request_magic_link(req: MagicLinkRequest):
    if req.email != OWNER_EMAIL:
        return {"sent": True}

    token = secrets.token_hex(32)
    expires_at = int(time.time()) + MAGIC_TOKEN_TTL_SECONDS
    magic_tokens_table.put_item(
        Item={"token": token, "expires_at": expires_at}
    )

    link = f"{MAGIC_LINK_BASE_URL}?magic={token}"
    ses.send_email(
        Source=SES_SENDER_EMAIL,
        Destination={"ToAddresses": [OWNER_EMAIL]},
        Message={
            "Subject": {
                "Data": "Your blog admin sign-in link",
                "Charset": "UTF-8",
            },
            "Body": {
                "Text": {
                    "Data": (
                        "Sign in to the blog admin:\n\n"
                        f"{link}\n\n"
                        "This link expires in 15 minutes."
                    ),
                    "Charset": "UTF-8",
                },
                "Html": {
                    "Data": (
                        f'<p><a href="{link}">Sign in to the blog admin</a></p>'
                        "<p>This link expires in 15 minutes.</p>"
                    ),
                    "Charset": "UTF-8",
                },
            },
        },
    )
    return {"sent": True}


def invalid_magic_token():
    raise HTTPException(status_code=401, detail="Invalid or expired magic link")


@app.get("/api/auth/verify")
def verify_magic_link(token: Optional[str] = None):
    if not token:
        invalid_magic_token()

    item = magic_tokens_table.get_item(
        Key={"token": token}, ConsistentRead=True
    ).get("Item")
    if not item:
        invalid_magic_token()

    try:
        expires_at = int(item["expires_at"])
    except (KeyError, TypeError, ValueError):
        magic_tokens_table.delete_item(Key={"token": token})
        invalid_magic_token()

    if expires_at <= int(time.time()):
        magic_tokens_table.delete_item(Key={"token": token})
        invalid_magic_token()

    try:
        magic_tokens_table.delete_item(
            Key={"token": token},
            ConditionExpression="attribute_exists(#token)",
            ExpressionAttributeNames={"#token": "token"},
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            invalid_magic_token()
        raise

    return {"admin_token": get_admin_token()}


@app.get("/api/posts")
def list_posts(_: None = Depends(verify_token)):
    posts = []
    for prefix in ["drafts/", "published/"]:
        paginator = s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=BLOG_CONTENT_BUCKET, Prefix=prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                slug = key.split("/", 1)[1].removesuffix(".md")
                meta, _ = read_post(key)
                posts.append({
                    **meta,
                    "slug": slug,
                    "status": "published" if prefix == "published/" else "draft",
                    "last_modified": obj["LastModified"].isoformat(),
                })
    posts.sort(key=lambda p: p.get("date", ""), reverse=True)
    return {"posts": posts}


@app.get("/api/posts/{slug}")
def get_post(slug: str, _: None = Depends(verify_token)):
    key = find_post_key(slug)
    if not key:
        raise HTTPException(status_code=404, detail="Post not found")
    meta, body = read_post(key)
    return {**meta, "slug": slug, "body": body,
            "status": "published" if key.startswith("published/") else "draft"}


@app.post("/api/posts")
def create_post(req: CreatePostRequest, _: None = Depends(verify_token)):
    meta = {
        "title": req.title,
        "date": req.date,
        "updated": req.date,
        "summary": req.summary,
        "tags": req.tags,
        "published": False,
        "slug": req.slug,
    }
    content = serialize_post(meta, req.body)
    s3.put_object(
        Bucket=BLOG_CONTENT_BUCKET,
        Key=f"drafts/{req.slug}.md",
        Body=content.encode(),
        ContentType="text/markdown",
    )
    return {"slug": req.slug, "status": "draft"}


@app.put("/api/posts/{slug}")
def update_post(slug: str, req: UpdatePostRequest, _: None = Depends(verify_token)):
    key = find_post_key(slug)
    if not key:
        raise HTTPException(status_code=404, detail="Post not found")
    meta, body = read_post(key)
    if req.title is not None:
        meta["title"] = req.title
    if req.summary is not None:
        meta["summary"] = req.summary
    if req.tags is not None:
        meta["tags"] = req.tags
    meta["updated"] = date.today().isoformat()
    new_body = req.body if req.body is not None else body
    s3.put_object(
        Bucket=BLOG_CONTENT_BUCKET,
        Key=key,
        Body=serialize_post(meta, new_body).encode(),
        ContentType="text/markdown",
    )
    return {"slug": slug, "status": "published" if key.startswith("published/") else "draft"}


@app.post("/api/posts/{slug}/publish")
def publish_post(slug: str, _: None = Depends(verify_token)):
    key = find_post_key(slug)
    if not key:
        raise HTTPException(status_code=404, detail="Post not found")
    if key.startswith("published/"):
        return {"slug": slug, "status": "published"}
    meta, body = read_post(key)
    meta["published"] = True
    meta["updated"] = date.today().isoformat()
    published_key = f"published/{slug}.md"
    s3.copy_object(
        Bucket=BLOG_CONTENT_BUCKET,
        CopySource={"Bucket": BLOG_CONTENT_BUCKET, "Key": key},
        Key=published_key,
    )
    s3.put_object(
        Bucket=BLOG_CONTENT_BUCKET,
        Key=published_key,
        Body=serialize_post(meta, body).encode(),
        ContentType="text/markdown",
    )
    s3.delete_object(Bucket=BLOG_CONTENT_BUCKET, Key=key)
    trigger_blog_rebuild()
    return {"slug": slug, "status": "published"}


@app.post("/api/posts/{slug}/unpublish")
def unpublish_post(slug: str, _: None = Depends(verify_token)):
    key = find_post_key(slug)
    if not key:
        raise HTTPException(status_code=404, detail="Post not found")
    if key.startswith("drafts/"):
        return {"slug": slug, "status": "draft"}
    meta, body = read_post(key)
    meta["published"] = False
    meta["updated"] = date.today().isoformat()
    draft_key = f"drafts/{slug}.md"
    s3.copy_object(
        Bucket=BLOG_CONTENT_BUCKET,
        CopySource={"Bucket": BLOG_CONTENT_BUCKET, "Key": key},
        Key=draft_key,
    )
    s3.put_object(
        Bucket=BLOG_CONTENT_BUCKET,
        Key=draft_key,
        Body=serialize_post(meta, body).encode(),
        ContentType="text/markdown",
    )
    s3.delete_object(Bucket=BLOG_CONTENT_BUCKET, Key=key)
    trigger_blog_rebuild()
    return {"slug": slug, "status": "draft"}


@app.delete("/api/posts/{slug}")
def delete_post(slug: str, req: DeleteRequest, _: None = Depends(verify_token)):
    if not req.confirm:
        raise HTTPException(status_code=400, detail="confirm must be true")
    key = find_post_key(slug)
    if not key:
        raise HTTPException(status_code=404, detail="Post not found")
    was_published = key.startswith("published/")
    meta, _ = read_post(key)
    s3.delete_object(Bucket=BLOG_CONTENT_BUCKET, Key=key)
    if was_published:
        trigger_blog_rebuild()
    return {"slug": slug, "deleted": True}

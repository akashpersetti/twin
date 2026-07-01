import os
import sys
import json
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Freeze token cache values before importing blog_server
# so boto3 client creation doesn't need real AWS credentials
import blog_server as blog_module

from fastapi.testclient import TestClient

VALID_TOKEN = "test-secret-token"
BUCKET = "test-blog-content"

client = TestClient(blog_module.app)


@pytest.fixture(autouse=True)
def reset_state():
    """Pin cached SSM values and bucket name for every test."""
    blog_module._admin_token = VALID_TOKEN
    blog_module._github_pat = "test-github-pat"
    blog_module.BLOG_CONTENT_BUCKET = BUCKET
    yield
    blog_module._admin_token = None
    blog_module._github_pat = None


def auth():
    return {"Authorization": f"Bearer {VALID_TOKEN}"}


SAMPLE_MD = """\
---
title: My Post
date: '2026-06-30'
updated: '2026-06-30'
summary: A summary
tags:
- AWS
published: false
slug: my-post
---

Body text here.
"""


# ── Auth ──────────────────────────────────────────────────────────────────────

def test_missing_token_returns_401():
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.get_paginator.return_value.paginate.return_value = [{"Contents": []}]
        resp = client.get("/api/posts")
    assert resp.status_code == 401


def test_wrong_token_returns_401():
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.get_paginator.return_value.paginate.return_value = [{"Contents": []}]
        resp = client.get("/api/posts", headers={"Authorization": "Bearer wrong"})
    assert resp.status_code == 401


# ── List posts ────────────────────────────────────────────────────────────────

def test_list_posts_empty():
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.get_paginator.return_value.paginate.return_value = [{"Contents": []}]
        resp = client.get("/api/posts", headers=auth())
    assert resp.status_code == 200
    assert resp.json()["posts"] == []


def test_list_posts_returns_frontmatter_only():
    mock_page = [{"Contents": [{"Key": "drafts/my-post.md", "LastModified": __import__("datetime").datetime(2026, 6, 30)}]}]
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.get_paginator.return_value.paginate.side_effect = [mock_page, [{"Contents": []}]]
        mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: SAMPLE_MD.encode())}
        resp = client.get("/api/posts", headers=auth())
    assert resp.status_code == 200
    posts = resp.json()["posts"]
    assert len(posts) == 1
    assert posts[0]["title"] == "My Post"
    assert posts[0]["status"] == "draft"
    assert "Body text here" not in str(posts[0])


# ── Get post ──────────────────────────────────────────────────────────────────

def test_get_post_returns_body():
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.head_object.return_value = {}
        mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: SAMPLE_MD.encode())}
        resp = client.get("/api/posts/my-post", headers=auth())
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "My Post"
    assert "Body text here" in data["body"]


def test_get_post_not_found_returns_404():
    from botocore.exceptions import ClientError
    err = ClientError({"Error": {"Code": "404", "Message": "Not Found"}}, "HeadObject")
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.head_object.side_effect = err
        resp = client.get("/api/posts/does-not-exist", headers=auth())
    assert resp.status_code == 404


# ── Create post ───────────────────────────────────────────────────────────────

def test_create_post_writes_to_drafts():
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.put_object.return_value = {}
        resp = client.post("/api/posts", headers=auth(), json={
            "title": "New Post",
            "slug": "new-post",
            "summary": "Summary",
            "tags": ["AWS"],
            "date": "2026-06-30",
            "body": "Hello world",
        })
    assert resp.status_code == 200
    assert resp.json()["slug"] == "new-post"
    call_kwargs = mock_s3.put_object.call_args[1]
    assert call_kwargs["Key"] == "drafts/new-post.md"
    assert "published: false" in call_kwargs["Body"].decode()


# ── Update post ───────────────────────────────────────────────────────────────

def test_update_post_overwrites_file():
    with patch.object(blog_module, "s3") as mock_s3:
        mock_s3.head_object.return_value = {}
        mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: SAMPLE_MD.encode())}
        mock_s3.put_object.return_value = {}
        resp = client.put("/api/posts/my-post", headers=auth(), json={
            "title": "Updated Title",
            "summary": "New summary",
            "tags": ["AWS", "Bedrock"],
            "body": "Updated body",
        })
    assert resp.status_code == 200
    call_kwargs = mock_s3.put_object.call_args[1]
    assert "Updated Title" in call_kwargs["Body"].decode()


# ── Publish / unpublish ────────────────────────────────────────────────────────

def test_publish_moves_draft_to_published():
    with patch.object(blog_module, "s3") as mock_s3, \
         patch.object(blog_module, "trigger_blog_rebuild") as mock_rebuild:
        mock_s3.head_object.return_value = {}
        mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: SAMPLE_MD.encode())}
        mock_s3.copy_object.return_value = {}
        mock_s3.delete_object.return_value = {}
        resp = client.post("/api/posts/my-post/publish", headers=auth())
    assert resp.status_code == 200
    copy_call = mock_s3.copy_object.call_args[1]
    assert copy_call["Key"] == "published/my-post.md"
    assert mock_s3.delete_object.call_args[1]["Key"] == "drafts/my-post.md"
    mock_rebuild.assert_called_once()


def test_unpublish_moves_published_to_draft():
    published_md = SAMPLE_MD.replace("published: false", "published: true")
    with patch.object(blog_module, "s3") as mock_s3, \
         patch.object(blog_module, "trigger_blog_rebuild") as mock_rebuild:
        # head_object: not in drafts, found in published
        from botocore.exceptions import ClientError
        not_found = ClientError({"Error": {"Code": "404", "Message": ""}}, "HeadObject")
        mock_s3.head_object.side_effect = [not_found, {}]
        mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: published_md.encode())}
        mock_s3.copy_object.return_value = {}
        mock_s3.delete_object.return_value = {}
        resp = client.post("/api/posts/my-post/unpublish", headers=auth())
    assert resp.status_code == 200
    copy_call = mock_s3.copy_object.call_args[1]
    assert copy_call["Key"] == "drafts/my-post.md"
    mock_rebuild.assert_called_once()


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_requires_confirm_flag():
    with patch.object(blog_module, "s3"):
        resp = client.request(
            "DELETE",
            "/api/posts/my-post",
            headers={**auth(), "Content-Type": "application/json"},
            content=json.dumps({}),
        )
    assert resp.status_code == 400


def test_delete_removes_file():
    with patch.object(blog_module, "s3") as mock_s3, \
         patch.object(blog_module, "trigger_blog_rebuild"):
        mock_s3.head_object.return_value = {}
        mock_s3.get_object.return_value = {"Body": MagicMock(read=lambda: SAMPLE_MD.encode())}
        mock_s3.delete_object.return_value = {}
        resp = client.request(
            "DELETE",
            "/api/posts/my-post",
            headers={**auth(), "Content-Type": "application/json"},
            content=json.dumps({"confirm": True}),
        )
    assert resp.status_code == 200
    assert mock_s3.delete_object.called

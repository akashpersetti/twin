import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import bedrock_client


def test_bedrock_client_is_configured():
    assert bedrock_client.bedrock_client is not None


def test_bedrock_model_id_has_default():
    assert bedrock_client.BEDROCK_MODEL_ID  # non-empty string
    assert "claude" in bedrock_client.BEDROCK_MODEL_ID.lower()


def test_judge_model_id_has_default():
    assert bedrock_client.JUDGE_MODEL_ID  # non-empty string


def test_parse_json_object_extracts_plain_json():
    assert bedrock_client.parse_json_object('{"a": 1, "b": [1, 2]}') == {"a": 1, "b": [1, 2]}


def test_parse_json_object_strips_markdown_fences_and_commentary():
    raw = 'Sure, here you go:\n```json\n{"on_topic": true, "reason": "career question"}\n```'
    assert bedrock_client.parse_json_object(raw) == {"on_topic": True, "reason": "career question"}


def test_parse_json_object_handles_nested_braces():
    raw = '{"outer": {"inner": 1}, "list": [{"x": 2}]}'
    assert bedrock_client.parse_json_object(raw) == {"outer": {"inner": 1}, "list": [{"x": 2}]}

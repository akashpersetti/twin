import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from server import build_bedrock_messages


def test_no_user_name_leaves_system_prompt_unchanged():
    msgs = build_bedrock_messages([], "hello")
    assert len(msgs) == 2
    assert "System:" in msgs[0]["content"][0]["text"]
    assert "visitor's name" not in msgs[0]["content"][0]["text"]
    assert msgs[-1]["content"][0]["text"] == "hello"


def test_user_name_is_appended_to_system_context():
    msgs = build_bedrock_messages([], "hello", user_name="Sarah")
    system_text = msgs[0]["content"][0]["text"]
    assert "Sarah" in system_text
    assert "visitor's name" in system_text


def test_greet_sentinel_with_name_is_replaced():
    msgs = build_bedrock_messages([], "__greet__", user_name="Sarah")
    last = msgs[-1]["content"][0]["text"]
    assert "__greet__" not in last
    assert "Sarah" in last


def test_greet_sentinel_without_name_is_replaced():
    msgs = build_bedrock_messages([], "__greet__")
    last = msgs[-1]["content"][0]["text"]
    assert "__greet__" not in last

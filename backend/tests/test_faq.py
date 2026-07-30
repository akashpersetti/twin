import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import server


def test_get_faq_returns_matching_entry():
    entry = server.get_faq(1)
    assert entry is not None
    assert entry["faq"] == 1
    assert "question" in entry
    assert "answer" in entry


def test_get_faq_returns_none_for_unknown_number():
    assert server.get_faq(999) is None


def test_match_faq_shortcut_matches_various_casing_and_whitespace():
    assert server.match_faq_shortcut("Q1")["faq"] == 1
    assert server.match_faq_shortcut("q1")["faq"] == 1
    assert server.match_faq_shortcut("  Q1  ")["faq"] == 1


def test_match_faq_shortcut_rejects_non_shortcut_text():
    assert server.match_faq_shortcut("Q1x") is None
    assert server.match_faq_shortcut("hello") is None
    assert server.match_faq_shortcut("Q") is None


def test_match_faq_shortcut_returns_none_for_unknown_number():
    assert server.match_faq_shortcut("Q999") is None


def test_match_faq_shortcut_returns_none_for_extremely_long_number():
    assert server.match_faq_shortcut("Q" + "9" * 5000) is None


from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

client = TestClient(server.app)


def test_chat_endpoint_answers_qn_shortcut_without_calling_bedrock():
    server._request_log.clear()
    with patch.object(server, "call_bedrock") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save:
        resp = client.post("/chat", json={"message": "Q1", "session_id": "faq-test-1"})
    assert resp.status_code == 200
    body = resp.json()
    faq_one = server.get_faq(1)
    assert body["response"] == f"**Q1:** {faq_one['question']}\n\n{faq_one['answer']}"
    mock_call_bedrock.assert_not_called()
    saved_conversation = mock_save.call_args.args[1]
    assert saved_conversation[-1]["content"] == body["response"]
    assert saved_conversation[-2]["content"] == "Q1"


def test_chat_endpoint_falls_through_for_unknown_qn():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value="hi") as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server.retrieval, "retrieve", return_value=[]):
        resp = client.post("/chat", json={"message": "Q999", "session_id": "faq-test-2"})
    assert resp.status_code == 200
    mock_call_bedrock.assert_called_once()


def test_call_bedrock_returns_direct_text_when_no_tool_use():
    response = {
        "output": {"message": {"content": [{"text": "Plain answer."}]}},
        "stopReason": "end_turn",
    }
    mock_converse = MagicMock(return_value=response)
    with patch.object(server.retrieval, "retrieve", return_value=[]), \
         patch.object(server.bedrock_client, "converse", mock_converse):
        result = server.call_bedrock([], "Tell me something.")
    assert result == "Plain answer."
    assert mock_converse.call_count == 1


def test_call_bedrock_uses_faq_tool_when_model_requests_it():
    tool_use_response = {
        "output": {
            "message": {
                "role": "assistant",
                "content": [
                    {"toolUse": {"toolUseId": "tool-1", "name": "faq_tool", "input": {"faq_number": 1}}}
                ],
            }
        },
        "stopReason": "tool_use",
    }
    final_response = {
        "output": {"message": {"content": [{"text": "Final answer using FAQ 1."}]}},
        "stopReason": "end_turn",
    }
    mock_converse = MagicMock(side_effect=[tool_use_response, final_response])
    with patch.object(server.retrieval, "retrieve", return_value=[]), \
         patch.object(server.bedrock_client, "converse", mock_converse):
        result = server.call_bedrock([], "What are you working on?")

    assert result == "Final answer using FAQ 1."
    assert mock_converse.call_count == 2

    first_call_kwargs = mock_converse.call_args_list[0].kwargs
    assert first_call_kwargs["toolConfig"] == server.FAQ_TOOL_CONFIG

    second_call_messages = mock_converse.call_args_list[1].kwargs["messages"]
    tool_result_message = second_call_messages[-1]
    assert tool_result_message["role"] == "user"
    tool_result_block = tool_result_message["content"][0]["toolResult"]
    assert tool_result_block["toolUseId"] == "tool-1"

    faq_one = server.get_faq(1)
    result_text = tool_result_block["content"][0]["text"]
    assert faq_one["question"] in result_text
    assert faq_one["answer"] in result_text

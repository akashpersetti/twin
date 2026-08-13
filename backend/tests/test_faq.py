import os
import sys
import json

import pytest

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


def _tool_use_stream_events(tool_name, tool_input, final_text):
    """Build a converse_stream event iterator: one tool_use turn, then a text-only follow-up turn is NOT
    included here — the second bedrock_client.converse_stream call is mocked separately per test."""
    import json as _json
    return iter([
        {"contentBlockStart": {"contentBlockIndex": 0, "start": {"toolUse": {"toolUseId": "t1", "name": tool_name}}}},
        {"contentBlockDelta": {"contentBlockIndex": 0, "delta": {"toolUse": {"input": _json.dumps(tool_input)}}}},
        {"messageStop": {"stopReason": "tool_use"}},
    ])


@pytest.fixture(autouse=True)
def bot_controlled_by_default():
    with patch.object(server, "get_controlled_by", return_value="bot"):
        yield


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
    with patch.object(server, "call_bedrock", return_value=("hi", False)) as mock_call_bedrock, \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server, "check_scope", return_value=True), \
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
    assert result == ("Plain answer.", False)
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

    assert result == ("Final answer using FAQ 1.", False)
    assert mock_converse.call_count == 2

    first_call_kwargs = mock_converse.call_args_list[0].kwargs
    assert first_call_kwargs["toolConfig"] == server.TOOL_CONFIG

    second_call_messages = mock_converse.call_args_list[1].kwargs["messages"]
    tool_result_message = second_call_messages[-1]
    assert tool_result_message["role"] == "user"
    tool_result_block = tool_result_message["content"][0]["toolResult"]
    assert tool_result_block["toolUseId"] == "tool-1"

    faq_one = server.get_faq(1)
    result_text = tool_result_block["content"][0]["text"]
    assert faq_one["question"] in result_text
    assert faq_one["answer"] in result_text


def test_call_bedrock_escalates_when_model_requests_it():
    tool_use_response = {
        "output": {
            "message": {
                "role": "assistant",
                "content": [
                    {"toolUse": {"toolUseId": "tool-2", "name": "escalate_to_human_tool", "input": {"reason": "visitor wants a demo"}}}
                ],
            }
        },
        "stopReason": "tool_use",
    }
    final_response = {
        "output": {"message": {"content": [{"text": "I've let Akash know and he'll follow up."}]}},
        "stopReason": "end_turn",
    }
    mock_converse = MagicMock(side_effect=[tool_use_response, final_response])
    with patch.object(server.retrieval, "retrieve", return_value=[]), \
         patch.object(server.bedrock_client, "converse", mock_converse):
        result = server.call_bedrock([], "Can I talk to a real person?")

    assert result == ("I've let Akash know and he'll follow up.", True)
    assert mock_converse.call_count == 2


def test_chat_endpoint_sets_needs_attention_when_escalated():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value=("I've flagged this for Akash.", True)), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation") as mock_save, \
         patch.object(server.retrieval, "retrieve", return_value=[]):
        client.post("/chat", json={"message": "I need to talk to a human", "session_id": "escalate-test"})

    saved_conversation = mock_save.call_args.args[1]
    assistant_message = next(m for m in saved_conversation if m["role"] == "assistant")
    assert assistant_message["needs_attention"] is True
    user_message = next(m for m in saved_conversation if m["role"] == "user")
    assert user_message["needs_attention"] is False


def test_build_bedrock_messages_maps_human_role_to_assistant():
    conversation = [
        {"role": "user", "content": "hi", "timestamp": "t1", "needs_attention": False, "read": False},
        {"role": "human", "content": "This is Akash, happy to help directly.", "timestamp": "t2", "needs_attention": False, "read": True},
    ]
    with patch.object(server.retrieval, "retrieve", return_value=[]):
        messages = server.build_bedrock_messages(conversation, "another question")

    human_entry = next(m for m in messages if m["content"][0]["text"] == "This is Akash, happy to help directly.")
    assert human_entry["role"] == "assistant"


def test_build_bedrock_messages_maps_system_role_to_assistant():
    conversation = [
        {"role": "user", "content": "hi", "timestamp": "t1", "needs_attention": False, "read": False},
        {"role": "system", "content": "You're now chatting with the assistant again.", "timestamp": "t2", "needs_attention": False, "read": True},
    ]
    with patch.object(server.retrieval, "retrieve", return_value=[]):
        messages = server.build_bedrock_messages(conversation, "another question")

    system_entry = next(m for m in messages if m["content"][0]["text"] == "You're now chatting with the assistant again.")
    assert system_entry["role"] == "assistant"


def test_chat_endpoint_sends_sns_notification_when_escalated():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value=("I've flagged this for Akash.", True)), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server.retrieval, "retrieve", return_value=[]), \
         patch.object(server, "SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789012:test-topic"), \
         patch.object(server, "sns_client") as mock_sns:
        client.post("/chat", json={"message": "I need to talk to a human", "session_id": "escalate-sns-test"})

    mock_sns.publish.assert_called_once()
    call_kwargs = mock_sns.publish.call_args.kwargs
    assert call_kwargs["TopicArn"] == "arn:aws:sns:us-east-1:123456789012:test-topic"
    assert "Subject" in call_kwargs
    assert "Message" in call_kwargs


def test_chat_endpoint_skips_sns_notification_when_not_escalated():
    server._request_log.clear()
    with patch.object(server, "call_bedrock", return_value=("Just a normal answer.", False)), \
         patch.object(server, "load_conversation", return_value=[]), \
         patch.object(server, "save_conversation"), \
         patch.object(server.retrieval, "retrieve", return_value=[]), \
         patch.object(server, "SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789012:test-topic"), \
         patch.object(server, "sns_client") as mock_sns:
        client.post("/chat", json={"message": "hello", "session_id": "no-escalate-sns-test"})

    mock_sns.publish.assert_not_called()


def test_stream_bedrock_faq_tool_round_trip():
    from server import stream_bedrock

    # First call: tool use request
    first_response = _tool_use_stream_events("faq_tool", {"faq_number": 1}, None)
    # Second call: follow-up with tool result
    second_response = iter([
        {"contentBlockStart": {"contentBlockIndex": 0, "start": {"text": {}}}},
        {"contentBlockDelta": {"contentBlockIndex": 0, "delta": {"text": "The answer to Q1."}}},
        {"messageStop": {"stopReason": "end_turn"}},
    ])

    with patch("server.bedrock_client.converse_stream") as mock_converse, \
         patch("server.save_conversation"), \
         patch("server.retrieval.retrieve", return_value=[]):
        mock_converse.side_effect = [
            {"stream": first_response},
            {"stream": second_response}
        ]
        generator = stream_bedrock([], "Do you have Q1?", "test-session")
        chunks = list(generator)

    # Verify both calls to Bedrock were made
    assert mock_converse.call_count == 2

    # Verify the second call included the tool result
    second_call_args = mock_converse.call_args_list[1]
    messages_arg = second_call_args[1]["messages"]
    tool_result_message = next(m for m in messages_arg if m["role"] == "user" and "toolResult" in m["content"][0])
    assert tool_result_message["content"][0]["toolResult"]["toolUseId"] == "t1"

    # Verify final text output includes the follow-up answer
    # Chunks are SSE strings like "data: {json}\n\n", so parse them
    final_text = ""
    for chunk in chunks:
        if isinstance(chunk, str) and chunk.startswith("data: "):
            try:
                data = json.loads(chunk[6:])  # Strip "data: " prefix
                if "chunk" in data:
                    final_text += data["chunk"]
            except json.JSONDecodeError:
                pass
    assert "The answer to Q1." in final_text


def test_stream_bedrock_escalate_tool_sets_needs_attention():
    from server import stream_bedrock

    # First call: tool use request (escalate_to_human_tool)
    first_response = _tool_use_stream_events("escalate_to_human_tool", {}, None)
    # Second call: follow-up with tool result
    second_response = iter([
        {"contentBlockStart": {"contentBlockIndex": 0, "start": {"text": {}}}},
        {"contentBlockDelta": {"contentBlockIndex": 0, "delta": {"text": "I'm escalating this to your developer."}}},
        {"messageStop": {"stopReason": "end_turn"}},
    ])

    with patch("server.bedrock_client.converse_stream") as mock_converse, \
         patch("server.save_conversation"), \
         patch("server.retrieval.retrieve", return_value=[]):
        mock_converse.side_effect = [
            {"stream": first_response},
            {"stream": second_response}
        ]
        generator = stream_bedrock([], "I need help", "test-session")
        chunks = list(generator)

    # Verify both calls to Bedrock were made
    assert mock_converse.call_count == 2

    # Check that the escalation flag was sent (will be in the SSE response)
    # The test verifies the tool is called; the escalation handling is checked by integration tests
    escalation_found = False
    for chunk in chunks:
        if isinstance(chunk, str) and chunk.startswith("data: "):
            try:
                data = json.loads(chunk[6:])  # Strip "data: " prefix
                if data.get("escalated") is True:
                    escalation_found = True
                    break
            except json.JSONDecodeError:
                pass
    assert escalation_found


def test_chat_stream_answers_qn_shortcut_without_calling_bedrock():
    def _read_sse_events(response):
        """Parse SSE events from a streaming response."""
        events = []
        for line in response.iter_lines():
            if isinstance(line, bytes):
                line = line.decode('utf-8')
            if line.startswith('data: '):
                try:
                    events.append(json.loads(line[6:]))
                except json.JSONDecodeError:
                    pass
        return events

    with patch("server.bedrock_client.converse_stream") as mock_converse_stream:
        response = client.post("/chat/stream", json={"message": "Q1"})
        events = _read_sse_events(response)

    mock_converse_stream.assert_not_called()
    chunks = [e["chunk"] for e in events if "chunk" in e]
    assert len(chunks) == 1
    assert chunks[0].startswith("**Q1:**")
    assert any(e.get("done") for e in events)


def test_stream_bedrock_escalate_publishes_sns():
    from server import stream_bedrock

    first_response = {"stream": _tool_use_stream_events("escalate_to_human_tool", {"reason": "wants a call"}, None)}
    second_response = {"stream": iter([
        {"contentBlockDelta": {"contentBlockIndex": 0, "delta": {"text": "I've let Akash know."}}},
        {"messageStop": {"stopReason": "end_turn"}},
    ])}

    with patch("server.bedrock_client.converse_stream", side_effect=[first_response, second_response]), \
         patch("server.save_conversation"), \
         patch("server.retrieval.retrieve", return_value=[]), \
         patch("server.sns_client.publish") as mock_publish, \
         patch("server.SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789012:test"):
        list(stream_bedrock([], "Can you get Akash?", "sess-sns"))

    mock_publish.assert_called_once()

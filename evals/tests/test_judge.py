import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import bedrock_client
import judge


def test_judge_answer_parses_response_json():
    fake_response = {
        "output": {
            "message": {
                "content": [
                    {
                        "text": (
                            '{"faithful": false, "hallucinated_claims": ["knows Rust"], '
                            '"correctly_refused": false, "rationale": "Invented a skill not in the source."}'
                        )
                    }
                ]
            }
        }
    }
    mock_client = MagicMock()
    mock_client.converse.return_value = fake_response

    with patch.object(bedrock_client, "bedrock_client", mock_client):
        result = judge.judge_answer("Do you know Rust?", "", "Yes, I'm fluent in Rust.")

    assert result == {
        "faithful": False,
        "hallucinated_claims": ["knows Rust"],
        "correctly_refused": False,
        "rationale": "Invented a skill not in the source.",
    }
    mock_client.converse.assert_called_once()
    call_kwargs = mock_client.converse.call_args.kwargs
    assert call_kwargs["modelId"] == bedrock_client.BEDROCK_MODEL_ID


def test_judge_answer_strips_markdown_fences():
    fake_response = {
        "output": {
            "message": {
                "content": [
                    {
                        "text": (
                            '```json\n{"faithful": true, "hallucinated_claims": [], '
                            '"correctly_refused": null, "rationale": "Matches source."}\n```'
                        )
                    }
                ]
            }
        }
    }
    mock_client = MagicMock()
    mock_client.converse.return_value = fake_response

    with patch.object(bedrock_client, "bedrock_client", mock_client):
        result = judge.judge_answer("What do you do?", "some source", "some answer")

    assert result == {
        "faithful": True,
        "hallucinated_claims": [],
        "correctly_refused": None,
        "rationale": "Matches source.",
    }

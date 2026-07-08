import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import bedrock_client


def test_bedrock_client_is_configured():
    assert bedrock_client.bedrock_client is not None


def test_bedrock_model_id_has_default():
    assert bedrock_client.BEDROCK_MODEL_ID  # non-empty string
    assert "claude" in bedrock_client.BEDROCK_MODEL_ID.lower()

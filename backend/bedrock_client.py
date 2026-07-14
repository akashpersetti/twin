import os
import boto3
from botocore.config import Config

# Bedrock (especially cross-region inference profiles for Claude models) has
# fairly tight default RPM/TPM quotas, and boto3's default "legacy" retry mode
# gives up after very few attempts with minimal backoff. "adaptive" mode adds a
# client-side rate limiter plus exponential backoff+jitter, which is what we
# need for eval runs that fire many Converse calls in quick succession.
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1"),
    config=Config(retries={"max_attempts": 10, "mode": "adaptive"}),
)

# Available models:
# - amazon.nova-micro-v1:0  (fastest, cheapest)
# - amazon.nova-lite-v1:0   (balanced)
# - amazon.nova-pro-v1:0    (most capable, higher cost)
# Heads up: you might need to add us. or eu. prefix to the below model id
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-5-20250929-v1:0")

# Faithfulness judging is a bounded structured-output classification task, not
# open-ended generation, so it doesn't need the answering model's reasoning
# power. Decoupled from BEDROCK_MODEL_ID to cut token cost (Nova Lite is far
# cheaper than Sonnet) and to spread load across a separate model quota.
JUDGE_MODEL_ID = os.getenv("JUDGE_MODEL_ID", "amazon.nova-lite-v1:0")

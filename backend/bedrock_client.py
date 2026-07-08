import os
import boto3

bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1"),
)

# Available models:
# - amazon.nova-micro-v1:0  (fastest, cheapest)
# - amazon.nova-lite-v1:0   (balanced)
# - amazon.nova-pro-v1:0    (most capable, higher cost)
# Heads up: you might need to add us. or eu. prefix to the below model id
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-5-20250929-v1:0")

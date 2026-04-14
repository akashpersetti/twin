project_name             = "twin"
environment              = "prod"
bedrock_model_id         = "us.anthropic.claude-sonnet-4-20250514-v1:0"
lambda_timeout           = 60
api_throttle_burst_limit = 10
api_throttle_rate_limit  = 5
use_custom_domain        = false
root_domain              = ""

# Bring-your-own-cert custom domain (DNS managed externally via Namecheap)
acm_certificate_arn = "arn:aws:acm:us-east-1:914697327092:certificate/9147fdc9-39f8-4eef-8354-bbdefda6d649"
domain_aliases      = ["akashpersetti.com", "www.akashpersetti.com"]

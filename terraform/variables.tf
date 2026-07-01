variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, prod."
  }
}

variable "bedrock_model_id" {
  description = "Bedrock model ID"
  type        = string
  default     = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 10
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 5
}

variable "use_custom_domain" {
  description = "Attach a custom domain to CloudFront"
  type        = bool
  default     = false
}

variable "root_domain" {
  description = "Apex domain name, e.g. mydomain.com"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN of an existing ACM certificate in us-east-1 (bring-your-own-cert; skips Route 53 resources)"
  type        = string
  default     = ""
}

variable "domain_aliases" {
  description = "Custom domain aliases to attach to CloudFront when using an existing cert"
  type        = list(string)
  default     = []
}

variable "notification_email" {
  description = "Email address to receive visitor interaction notifications"
  type        = string
  default     = ""
}

variable "blog_domain" {
  description = "Full blog subdomain, e.g. blog.akashpersetti.com. Empty string = no custom domain."
  type        = string
  default     = ""
}

variable "blog_github_repo" {
  description = "GitHub owner/repo for repository_dispatch (blog rebuild trigger)"
  type        = string
  default     = "akashpersetti/twin"
}

variable "blog_acm_certificate_arn" {
  description = "ARN of ACM cert (us-east-1) for the blog CloudFront. Must cover blog_domain."
  type        = string
  default     = ""
}

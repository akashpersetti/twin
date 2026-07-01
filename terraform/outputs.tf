output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "cloudfront_url" {
  description = "URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "s3_frontend_bucket" {
  description = "Name of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "s3_memory_bucket" {
  description = "Name of the S3 bucket for memory storage"
  value       = aws_s3_bucket.memory.id
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "custom_domain_url" {
  description = "Root URL of the production site"
  value       = var.use_custom_domain ? "https://${var.root_domain}" : ""
}

output "blog_content_bucket" {
  description = "S3 bucket name for blog Markdown content"
  value       = aws_s3_bucket.blog_content.id
}

output "blog_site_bucket" {
  description = "S3 bucket name for rendered public blog"
  value       = aws_s3_bucket.blog_site.id
}

output "blog_cloudfront_domain" {
  description = "CloudFront domain for blog — use as CNAME target in Route 53"
  value       = aws_cloudfront_distribution.blog[0].domain_name
}

output "blog_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for blog — set as GitHub Actions secret BLOG_CF_DISTRIBUTION_ID"
  value       = aws_cloudfront_distribution.blog[0].id
}
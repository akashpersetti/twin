# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

locals {
  # Prefer explicit domain_aliases (BYOC path); fall back to Route53-managed path; else none
  aliases = length(var.domain_aliases) > 0 ? var.domain_aliases : (
    var.use_custom_domain && var.root_domain != "" ? [var.root_domain, "www.${var.root_domain}"] : []
  )

  # Prefer provided cert ARN; fall back to Route53-managed ACM cert; else null (default CF cert)
  cert_arn        = var.acm_certificate_arn != "" ? var.acm_certificate_arn : try(aws_acm_certificate.site[0].arn, null)
  use_custom_cert = local.cert_arn != null

  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# S3 bucket for conversation memory
resource "aws_s3_bucket" "memory" {
  bucket = "${local.name_prefix}-memory-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "memory" {
  bucket = aws_s3_bucket.memory.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "memory" {
  bucket = aws_s3_bucket.memory.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# S3 bucket for frontend static website
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  tags = local.common_tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "lambda_bedrock" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_sns_topic" "visitor_notifications" {
  name = "${local.name_prefix}-visitor-notifications"
}

resource "aws_sns_topic_subscription" "visitor_email" {
  topic_arn = aws_sns_topic.visitor_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_iam_role_policy" "lambda_sns" {
  name = "${local.name_prefix}-sns-policy"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = aws_sns_topic.visitor_notifications.arn
      }
    ]
  })
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename         = "${path.module}/../backend/lambda-deployment.zip"
  function_name    = "${local.name_prefix}-api"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_handler.handler"
  source_code_hash = filebase64sha256("${path.module}/../backend/lambda-deployment.zip")
  runtime          = "python3.12"
  architectures    = ["x86_64"]
  timeout          = var.lambda_timeout
  tags             = local.common_tags

  environment {
    variables = {
      CORS_ORIGINS       = var.use_custom_domain ? "https://${var.root_domain},https://www.${var.root_domain}" : "https://${aws_cloudfront_distribution.main.domain_name}"
      S3_BUCKET          = aws_s3_bucket.memory.id
      USE_S3             = "true"
      BEDROCK_MODEL_ID = var.bedrock_model_id
      SNS_TOPIC_ARN    = aws_sns_topic.visitor_notifications.arn
    }
  }

  # Ensure Lambda waits for the distribution to exist
  depends_on = [aws_cloudfront_distribution.main]
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api-gateway"
  protocol_type = "HTTP"
  tags          = local.common_tags

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_origins     = ["*"]
    max_age           = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
  tags        = local.common_tags

  default_route_settings {
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "get_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "post_chat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /chat"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "post_chat_stream" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /chat/stream"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "post_visitor" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /visitor"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Rewrite extension-less paths (e.g. /blog → /blog.html) before S3 sees them
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${local.name_prefix}-url-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var uri = event.request.uri;
      if (uri.endsWith('/')) {
        event.request.uri += 'index.html';
      } else if (!uri.split('/').pop().includes('.')) {
        event.request.uri += '.html';
      }
      return event.request;
    }
  EOF
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  aliases = local.aliases
  
  viewer_certificate {
    acm_certificate_arn            = local.use_custom_cert ? local.cert_arn : null
    cloudfront_default_certificate = local.use_custom_cert ? false : true
    ssl_support_method             = local.use_custom_cert ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  tags                = local.common_tags

  # Don't cache index.html so deploys show new JS/CSS (and styles like rose gradient) immediately
  ordered_cache_behavior {
    path_pattern     = "/index.html"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

# Optional: Custom domain configuration (only created when use_custom_domain = true)
data "aws_route53_zone" "root" {
  count        = var.use_custom_domain ? 1 : 0
  name         = var.root_domain
  private_zone = false
}

resource "aws_acm_certificate" "site" {
  count                     = var.use_custom_domain ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.root_domain
  subject_alternative_names = ["www.${var.root_domain}"]
  validation_method         = "DNS"
  lifecycle { create_before_destroy = true }
  tags = local.common_tags
}

resource "aws_route53_record" "site_validation" {
  for_each = var.use_custom_domain ? {
    for dvo in aws_acm_certificate.site[0].domain_validation_options :
    dvo.domain_name => dvo
  } : {}

  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  ttl     = 300
  records = [each.value.resource_record_value]
}

resource "aws_acm_certificate_validation" "site" {
  count           = var.use_custom_domain ? 1 : 0
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [
    for r in aws_route53_record.site_validation : r.fqdn
  ]
}

resource "aws_route53_record" "alias_root" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = var.root_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_root_ipv6" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = var.root_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_www" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = "www.${var.root_domain}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_www_ipv6" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = data.aws_route53_zone.root[0].zone_id
  name    = "www.${var.root_domain}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# ── Blog content bucket (private — stores Markdown drafts + published) ────────

resource "aws_s3_bucket" "blog_content" {
  bucket = "${local.name_prefix}-blog-content-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "blog_content" {
  bucket = aws_s3_bucket.blog_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "blog_content" {
  bucket = aws_s3_bucket.blog_content.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

# ── Blog site bucket (public website — serves rendered static HTML) ───────────

resource "aws_s3_bucket" "blog_site" {
  bucket = "${local.name_prefix}-blog-site-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "blog_site" {
  bucket = aws_s3_bucket.blog_site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "blog_site" {
  bucket = aws_s3_bucket.blog_site.id

  index_document { suffix = "index.html" }
  error_document { key    = "404.html" }
}

resource "aws_s3_bucket_policy" "blog_site" {
  bucket = aws_s3_bucket.blog_site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.blog_site.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.blog_site]
}

# ── Blog Lambda IAM ───────────────────────────────────────────────────────────

resource "aws_iam_role" "blog_lambda_role" {
  name = "${local.name_prefix}-blog-lambda-role"
  tags = local.common_tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "blog_lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.blog_lambda_role.name
}

resource "aws_iam_role_policy" "blog_lambda_s3" {
  name = "${local.name_prefix}-blog-s3-policy"
  role = aws_iam_role.blog_lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.blog_content.arn,
        "${aws_s3_bucket.blog_content.arn}/*",
      ]
    }]
  })
}

resource "aws_iam_role_policy" "blog_lambda_ssm" {
  name = "${local.name_prefix}-blog-ssm-policy"
  role = aws_iam_role.blog_lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ssm:GetParameter"]
      Resource = [
        "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/twin/dev/blog-admin-token",
        "arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/twin/dev/github-pat",
      ]
    }]
  })
}

# ── Blog Lambda function ──────────────────────────────────────────────────────

resource "aws_lambda_function" "blog_api" {
  filename         = "${path.module}/../backend/blog-lambda.zip"
  function_name    = "${local.name_prefix}-blog-api"
  role             = aws_iam_role.blog_lambda_role.arn
  handler          = "blog_lambda_handler.handler"
  source_code_hash = filebase64sha256("${path.module}/../backend/blog-lambda.zip")
  runtime          = "python3.12"
  architectures    = ["x86_64"]
  timeout          = 30
  tags             = local.common_tags

  environment {
    variables = {
      BLOG_CONTENT_BUCKET = aws_s3_bucket.blog_content.id
      GITHUB_REPO         = var.blog_github_repo
    }
  }
}

resource "aws_lambda_permission" "blog_api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.blog_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ── Blog API Gateway integration + routes ─────────────────────────────────────

resource "aws_apigatewayv2_integration" "blog_lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.blog_api.invoke_arn
}

resource "aws_apigatewayv2_route" "blog_list_posts" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/posts"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

resource "aws_apigatewayv2_route" "blog_get_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/posts/{slug}"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

resource "aws_apigatewayv2_route" "blog_create_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /api/posts"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

resource "aws_apigatewayv2_route" "blog_update_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /api/posts/{slug}"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

resource "aws_apigatewayv2_route" "blog_publish_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /api/posts/{slug}/publish"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

resource "aws_apigatewayv2_route" "blog_unpublish_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /api/posts/{slug}/unpublish"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

resource "aws_apigatewayv2_route" "blog_delete_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /api/posts/{slug}"
  target    = "integrations/${aws_apigatewayv2_integration.blog_lambda.id}"
}

# ── Blog CloudFront distribution ──────────────────────────────────────────────

locals {
  blog_aliases    = var.blog_domain != "" ? [var.blog_domain] : []
  blog_cert_arn   = var.blog_acm_certificate_arn != "" ? var.blog_acm_certificate_arn : local.cert_arn
  blog_use_cert   = var.blog_domain != "" && local.blog_cert_arn != ""
}

resource "aws_cloudfront_distribution" "blog" {
  count   = 1
  aliases = local.blog_aliases

  viewer_certificate {
    acm_certificate_arn            = local.blog_use_cert ? local.blog_cert_arn : null
    cloudfront_default_certificate = local.blog_use_cert ? false : true
    ssl_support_method             = local.blog_use_cert ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  origin {
    domain_name = aws_s3_bucket_website_configuration.blog_site.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.blog_site.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  tags                = local.common_tags

  ordered_cache_behavior {
    path_pattern     = "/index.html"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.blog_site.id}"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.blog_site.id}"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

# ── Blog Route 53 CNAME for blog.akashpersetti.com ────────────────────────────

data "aws_route53_zone" "blog_zone" {
  count        = var.blog_domain != "" ? 1 : 0
  name         = join(".", slice(split(".", var.blog_domain), 1, length(split(".", var.blog_domain))))
  private_zone = false
}

resource "aws_route53_record" "blog" {
  count   = var.blog_domain != "" ? 1 : 0
  zone_id = data.aws_route53_zone.blog_zone[0].zone_id
  name    = var.blog_domain
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.blog[0].domain_name]
}
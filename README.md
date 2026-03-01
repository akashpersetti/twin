# Twin — AI Digital Twin

An interactive AI chatbot that represents **Akash Hadagali Persetti** on his personal website. Visitors can have natural conversations with an AI persona grounded in Akash's resume, LinkedIn profile, projects, and communication style — powered by AWS Bedrock and deployed serverlessly on AWS.

---

## How It Works

```
Browser
  │
  ├── CloudFront (CDN) ──► S3 (Next.js static site)
  │
  └── API Gateway (HTTP) ──► Lambda (FastAPI) ──► AWS Bedrock (LLM)
                                                       │
                                                       └──► S3 (conversation memory)
```

1. The Next.js frontend is served globally via CloudFront from S3.
2. Chat messages go through API Gateway to a FastAPI app running on Lambda.
3. Lambda calls AWS Bedrock (Amazon Nova / Google Gemma) with a persona-grounded system prompt built from Akash's facts, LinkedIn PDF, career summary, and communication style guide.
4. Conversation history is persisted per-session in S3 (or local filesystem for dev).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python 3.12, FastAPI, Uvicorn, Mangum |
| AI | AWS Bedrock (Amazon Nova Lite / Google Gemma 27B / Claude Sonnet 4) |
| Infrastructure | AWS Lambda, API Gateway (HTTP v2), CloudFront, S3, Route 53, ACM |
| IaC | Terraform (AWS provider ~6.0) |
| CI/CD | GitHub Actions with AWS OIDC |
| Packaging | Docker (Lambda zip), uv (Python), npm (Node) |

---

## Repository Structure

```
twin/
├── backend/                  # FastAPI application
│   ├── server.py             # API routes: /chat, /health, /conversation/{id}
│   ├── context.py            # Persona prompt engineering
│   ├── resources.py          # Loads training data
│   ├── lambda_handler.py     # Mangum Lambda entry point
│   ├── deploy.py             # Docker-based Lambda zip builder
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── data/
│       ├── facts.json        # Biographical info
│       ├── summary.txt       # Career summary
│       ├── style.txt         # Communication style guide
│       └── linkedin.pdf      # Full LinkedIn profile
│
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   └── layout.tsx        # Root layout + metadata
│   ├── components/
│   │   └── twin.tsx          # Chat interface component
│   ├── public/
│   │   └── avatar.png        # Avatar image (optional)
│   ├── next.config.ts        # Static export config
│   └── package.json
│
├── terraform/                # AWS infrastructure
│   ├── main.tf               # All AWS resources
│   ├── variables.tf          # Input variables
│   ├── outputs.tf            # CloudFront URL, API URL, bucket names
│   ├── versions.tf           # Provider versions
│   └── backend.tf            # S3 state backend
│
├── scripts/
│   ├── deploy.sh             # Full deployment pipeline
│   └── destroy.sh            # Tear down infrastructure
│
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
│
├── memory/                   # Local conversation storage (dev only)
└── .env.example              # Environment variable template
```

---

## Local Development

### Prerequisites

- Python 3.12+ and [uv](https://github.com/astral-sh/uv)
- Node.js 20+
- AWS CLI configured with credentials that have Bedrock access
- AWS Bedrock model access enabled in your account (Amazon Nova or Google Gemma)

### Backend

```bash
cd backend

# Copy and configure environment
cp ../.env.example .env
# Edit .env: set DEFAULT_AWS_REGION and BEDROCK_MODEL_ID

# Install dependencies and run
uv run uvicorn server:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Send a message |
| `GET` | `/conversation/{session_id}` | Retrieve conversation history |

**Chat request/response:**

```json
// POST /chat
{ "message": "What are your main skills?", "session_id": "optional-uuid" }

// Response
{ "response": "...", "session_id": "uuid" }
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Persona Configuration

The AI persona is assembled from files in `backend/data/`:

| File | Purpose |
|------|---------|
| `facts.json` | Biographical data (name, location, education, specialties) |
| `summary.txt` | Career narrative and areas of expertise |
| `style.txt` | Communication tone and personality guidance |
| `linkedin.pdf` | Full work history and project details |

The `context.py` module composes these into a system prompt with rules that prevent hallucination, jailbreaking, and unprofessional conversation.

**Bedrock models (configurable):**

| Model ID | Speed | Cost |
|---|---|---|
| `amazon.nova-micro-v1:0` | Fastest | Lowest |
| `amazon.nova-lite-v1:0` | Balanced | Moderate (default) |
| `amazon.nova-pro-v1:0` | Most capable | Higher |
| `google.gemma-3-27b-it` | High quality | Moderate |

> Note: Some models require a regional prefix (e.g. `us.amazon.nova-lite-v1:0`).

---

## Deployment

### One-time AWS setup

1. Create the Terraform state S3 bucket:
   ```bash
   aws s3 mb s3://twin-terraform-state-$(aws sts get-caller-identity --query Account --output text) \
     --region us-east-1
   ```

2. Enable Bedrock model access in the [AWS Bedrock console](https://console.aws.amazon.com/bedrock/home#/modelaccess).

3. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Fill in AWS_ACCOUNT_ID, DEFAULT_AWS_REGION, PROJECT_NAME
   ```

### Deploy manually

```bash
# Deploy to dev (default)
./scripts/deploy.sh dev twin

# Deploy to prod (uses prod.tfvars for custom domain config)
./scripts/deploy.sh prod twin
```

The script:
1. Builds the Lambda deployment zip using Docker
2. Initializes and applies Terraform
3. Builds the Next.js frontend (`npm run build`)
4. Syncs static files to S3
5. Uploads `avatar.png` with correct content-type
6. Prints the CloudFront and API Gateway URLs

### Destroy infrastructure

```bash
./scripts/destroy.sh dev twin
```

---

## CI/CD (GitHub Actions)

The workflow at `.github/workflows/deploy.yml` triggers on every push to `main` and can also be dispatched manually for any environment.

**Required GitHub secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC-based GitHub Actions auth |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID |
| `DEFAULT_AWS_REGION` | AWS region (e.g. `us-east-1`) |

**Pipeline steps:**
1. Checkout code
2. Authenticate to AWS via OIDC (no long-lived keys)
3. Build Lambda package (Python/uv/Docker)
4. Apply Terraform
5. Build and sync frontend to S3
6. Invalidate CloudFront cache
7. Print deployment summary

---

## Terraform Variables

| Variable | Default | Description |
|---|---|---|
| `project_name` | _(required)_ | Resource name prefix (lowercase, hyphens only) |
| `environment` | _(required)_ | `dev`, `test`, or `prod` |
| `bedrock_model_id` | `google.gemma-3-27b-it` | Bedrock model to use |
| `lambda_timeout` | `60` | Lambda timeout in seconds |
| `api_throttle_burst_limit` | `10` | API Gateway burst limit |
| `api_throttle_rate_limit` | `5` | API Gateway rate limit (req/s) |
| `use_custom_domain` | `false` | Attach a custom domain via Route 53 + ACM |
| `root_domain` | `""` | Apex domain (e.g. `example.com`) |

### Custom domain

Set `use_custom_domain = true` and `root_domain = "yourdomain.com"` in `terraform/prod.tfvars`. Terraform will provision an ACM certificate (DNS-validated) and Route 53 A/AAAA alias records pointing to CloudFront.

---

## Environment Variables

**Backend (`.env` for local dev):**

```env
DEFAULT_AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
USE_S3=false                        # true in production (set by Terraform)
S3_BUCKET=                          # set by Terraform in production
MEMORY_DIR=../memory                # local dev only
CORS_ORIGINS=http://localhost:3000
```

**Frontend (`.env.local` for local dev):**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AVATAR_VERSION=1        # optional cache-bust for avatar.png
```

---

## Avatar

Place a `frontend/public/avatar.png` file to show a profile photo in the chat interface. If the file is missing or fails to load, the chat falls back to a bot icon automatically.

---

## Infrastructure Overview

All AWS resources are named `{project_name}-{environment}-*` and tagged with `Project`, `Environment`, and `ManagedBy=terraform`.

| Resource | Purpose |
|---|---|
| `aws_s3_bucket.frontend` | Hosts Next.js static export |
| `aws_s3_bucket.memory` | Stores conversation history (private) |
| `aws_cloudfront_distribution.main` | CDN for frontend; forces HTTPS |
| `aws_apigatewayv2_api.main` | HTTP API Gateway with CORS |
| `aws_lambda_function.api` | Runs the FastAPI app via Mangum |
| `aws_iam_role.lambda_role` | Grants Lambda access to Bedrock + S3 |
| `aws_acm_certificate.site` | TLS certificate (only if custom domain) |
| `aws_route53_record.*` | DNS records (only if custom domain) |

Terraform state is stored in S3 with encryption enabled. Environments are isolated using Terraform workspaces.

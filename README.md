# Twin - AI Digital Twin of Akash Hadagali Persetti

Twin is an AI-powered digital twin that lives on Akash's personal portfolio website. Visitors can have natural, streaming conversations with an AI persona grounded in Akash's resume, LinkedIn profile, projects, and communication style - powered by Claude Sonnet on AWS Bedrock, deployed fully serverlessly on AWS.

---

## What is a Digital Twin?

A digital twin is an AI agent trained to faithfully represent a real person. Twin is always-on, answers questions about Akash's background, skills, and experience, and converses the way Akash would - professional, concise, and direct. It is not a generic chatbot; every response is grounded in real data and constrained from hallucinating.

The twin is accessible via a floating chat widget on the portfolio site. It persists conversation history across the session and streams responses token-by-token for a fluid experience.

---

## How Twin Works

```
+-------------------------------------------------------------------------+
|                              AWS Cloud                                  |
|                                                                         |
|   +----------------+     +-----------------+     +-------------------+  |
|   |  Route 53      | --> |   CloudFront    | --> |  S3 (Frontend)    |  |
|   |  (DNS)         |     |   (CDN/HTTPS)   |     |  Next.js static   |  |
|   +----------------+     +-----------------+     +-------------------+  |
|                                                                         |
|   +----------------+     +-----------------+     +-------------------+  |
|   |  API Gateway   | --> |  Lambda         | --> |  AWS Bedrock      |  |
|   |  (HTTP v2)     |     |  FastAPI/Mangum |     |  Claude Sonnet 4  |  |
|   +----------------+     +--------+--------+     +-------------------+  |
|                                   |                                     |
|                                   v                                     |
|                          +-----------------+                            |
|                          |  S3 (Memory)    |                            |
|                          |  Conversation   |                            |
|                          |  history/session|                            |
|                          +-----------------+                            |
|                                                                         |
|   +------------------------------------------+                          |
|   |  IAM Role  (Lambda -> Bedrock + S3)      |                          |
|   +------------------------------------------+                          |
|                                                                         |
|   +------------------------------------------+                          |
|   |  ACM Certificate  (TLS, custom domain)   |                          |
|   +------------------------------------------+                          |
+-------------------------------------------------------------------------+

Browser (User)
  │
  ├─── HTTPS ──► CloudFront ──► S3          (portfolio + chat UI)
  │
  └─── SSE  ──► API Gateway ──► Lambda ──► Bedrock   (streaming chat)
                                    │
                                    └──► S3 Memory    (session history)
```

1. The Next.js frontend is served globally via CloudFront from S3.
2. Chat messages POST to API Gateway, which forwards to a FastAPI app on Lambda.
3. Lambda assembles a persona-grounded system prompt from Akash's facts, LinkedIn PDF, career summary, and communication style guide - then calls Claude Sonnet 4 via `converse_stream`.
4. Tokens stream back to the browser via Server-Sent Events (SSE).
5. Conversation history is persisted per-session in S3 (or local filesystem in dev).

---

## Persona System

The twin's personality and knowledge are assembled in `backend/context.py` from four source files:

| File | Purpose |
|---|---|
| `backend/data/facts.json` | Biographical data - name, location, education, specialties |
| `backend/data/summary.txt` | Career narrative and areas of expertise |
| `backend/data/style.txt` | Communication tone and personality guidance |
| `backend/data/linkedin.pdf` | Full work history and project details |

These are composed into a system prompt at request time with the current date injected. The prompt enforces three hard rules:

1. **No hallucination** - if the answer isn't in the context, the twin says so.
2. **No jailbreaking** - instructions to ignore context are refused.
3. **No inappropriate content** - conversation is kept professional and on-topic.

The twin presents itself as Akash, speaks in first person, keeps answers concise, and never ends a response with a question.

---

## Streaming

Responses stream token-by-token using AWS Bedrock's `converse_stream` API:

- **Backend**: FastAPI `StreamingResponse` with `text/event-stream` content type. Each SSE event is one of: `{"session_id": "..."}` (first event), `{"chunk": "..."}` (token), or `{"done": true}` (end of stream).
- **Frontend**: `fetch` with `ReadableStream` reader parses SSE lines and appends chunks to the assistant message in real time. A static block cursor `▋` indicates streaming in progress.

---

## Chat Interface

The chat widget (`frontend/components/widgets/TwinFloatingButton.tsx`) is a fixed floating button in the bottom-right corner of the portfolio. It:

- Shows a profile photo when closed, an X when open
- Has a "Chat with Akash" label that nudges on page load and reappears on hover
- Expands to a 380×560px glass panel on desktop, or full-screen on mobile / when maximized
- Keeps the `<Twin>` component always mounted so conversation state survives open/close/fullscreen toggles without resetting

The terminal-style chat (`frontend/components/twin.tsx`) uses Geist Mono font and a CLI aesthetic:

- Messages have `YOU` / `◆ AKASH` labels with a colored left border instead of chat bubbles
- A hidden `<input>` captures keystrokes; a visual div renders the typed text with a static `▋` cursor
- Assistant messages render markdown via `react-markdown`
- Conversation persists for the lifetime of the browser session (resets on page reload)

---

## AI Model

The twin runs on **Claude Sonnet 4** via AWS Bedrock (`us.anthropic.claude-sonnet-4-20250514-v1:0`). Other models can be swapped via the `BEDROCK_MODEL_ID` environment variable:

| Model | Speed | Cost |
|---|---|---|
| `amazon.nova-micro-v1:0` | Fastest | Lowest |
| `amazon.nova-lite-v1:0` | Balanced | Moderate |
| `amazon.nova-pro-v1:0` | Most capable | Higher |
| `us.anthropic.claude-sonnet-4-20250514-v1:0` | High quality | Moderate (current) |

> Some models require a regional prefix - e.g. `us.amazon.nova-lite-v1:0`.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Send a message (non-streaming) |
| `POST` | `/chat/stream` | Send a message (SSE streaming) |
| `GET` | `/conversation/{session_id}` | Retrieve conversation history |

**Streaming request:**
```json
POST /chat/stream
{ "message": "What are your main skills?", "session_id": "optional-uuid" }
```

**Streaming response (SSE):**
```
data: {"session_id": "abc-123"}
data: {"chunk": "I specialize"}
data: {"chunk": " in ML and AI engineering"}
data: {"done": true}
```

---

## Repository Structure

```
twin/
├── backend/
│   ├── server.py             # FastAPI routes: /chat, /chat/stream, /health
│   ├── context.py            # Persona system prompt assembly
│   ├── resources.py          # Loads facts, summary, style, LinkedIn PDF
│   ├── lambda_handler.py     # Mangum Lambda entry point
│   ├── deploy.py             # Lambda zip builder
│   └── data/
│       ├── facts.json        # Biographical info
│       ├── summary.txt       # Career summary
│       ├── style.txt         # Communication style guide
│       └── linkedin.pdf      # Full LinkedIn profile
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Portfolio page (all sections)
│   │   ├── layout.tsx        # Root layout, FOWT prevention, metadata
│   │   └── globals.css       # Theme tokens, glass utilities, animations
│   ├── components/
│   │   ├── twin.tsx          # Terminal-style streaming chat component
│   │   ├── widgets/
│   │   │   └── TwinFloatingButton.tsx  # FAB + chat panel
│   │   ├── sections/         # Hero, Experience, Projects, Skills, etc.
│   │   └── ui/               # GlassCard, TiltCard, GradientText, etc.
│   ├── data/
│   │   └── resume.ts         # Single source of truth for all resume content
│   ├── hooks/                # useScrollSpy, useTheme, useReducedMotion
│   └── public/
│       └── avatar.png        # Profile photo (used in FAB and chat)
│
├── terraform/                # All AWS infrastructure as code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── backend.tf
│
├── scripts/
│   ├── deploy.sh             # Full deploy pipeline (Lambda → Terraform → S3)
│   └── destroy.sh            # Tear down all infrastructure
│
└── .github/workflows/
    └── deploy.yml            # CI/CD: triggers on push to main
```

---

## Local Development

### Prerequisites

- Python 3.12+ and [uv](https://github.com/astral-sh/uv)
- Node.js 20+
- AWS CLI configured with Bedrock access
- Bedrock model access enabled in your AWS account

### Backend

```bash
cd backend

# Copy and configure environment
cp ../.env.example .env
# Set DEFAULT_AWS_REGION and BEDROCK_MODEL_ID in .env

uv run uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Visit `http://localhost:3000`. The twin widget appears in the bottom-right corner.

---

## Deployment

### One-time setup

```bash
# Create Terraform state bucket
aws s3 mb s3://twin-terraform-state-$(aws sts get-caller-identity --query Account --output text) \
  --region us-east-1

# Enable model access in the AWS Bedrock console
```

### Deploy

```bash
# Dev (also triggered automatically on push to main)
./scripts/deploy.sh dev twin

# Prod (with custom domain if configured in prod.tfvars)
./scripts/deploy.sh prod twin
```

The script: builds the Lambda zip → runs `terraform apply` → builds Next.js → syncs to S3 → uploads avatar → prints URLs.

### Destroy

```bash
./scripts/destroy.sh dev twin
```

---

## CI/CD (GitHub Actions)

The workflow at `.github/workflows/deploy.yml` runs on every push to `main` (deploys to `dev`) and can be triggered manually for any environment via `workflow_dispatch`.

```
git push origin main
        │
        ▼
  GitHub Actions
        │
        ├── 1. Checkout code
        ├── 2. Authenticate to AWS via OIDC (no long-lived keys stored)
        ├── 3. Build Lambda zip  (Python / uv)
        ├── 4. terraform apply   (provisions / updates all AWS resources)
        ├── 5. npm run build     (Next.js static export)
        ├── 6. aws s3 sync       (upload frontend to S3)
        ├── 7. CloudFront invalidation  (/* - clears CDN cache immediately)
        └── 8. Print deployment summary (CloudFront URL, API URL, bucket)
```

**Required GitHub secrets:**

| Secret | Description |
|---|---|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC auth (no long-lived keys) |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID |
| `DEFAULT_AWS_REGION` | e.g. `us-east-1` |

**Manual deploy to prod:**

Go to **Actions → Deploy Digital Twin → Run workflow** and select `prod`. This uses `prod.tfvars` which can enable a custom domain via Route 53 + ACM.

---

## Environment Variables

**Backend (`.env`):**

```env
DEFAULT_AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0
USE_S3=false          # true in production (set automatically by Terraform)
S3_BUCKET=            # set by Terraform in production
MEMORY_DIR=../memory  # local dev only
CORS_ORIGINS=http://localhost:3000
```

**Frontend (`.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AVATAR_VERSION=1   # optional - cache-busts avatar.png
```

---

## Infrastructure

All resources are named `{project_name}-{environment}-*` and tagged with `Project`, `Environment`, and `ManagedBy=terraform`. State is stored in S3 with encryption. Environments are isolated via Terraform workspaces.

| Resource | Purpose |
|---|---|
| `aws_s3_bucket.frontend` | Hosts Next.js static export |
| `aws_s3_bucket.memory` | Stores conversation history (private) |
| `aws_cloudfront_distribution.main` | CDN; forces HTTPS |
| `aws_apigatewayv2_api.main` | HTTP API Gateway with CORS |
| `aws_lambda_function.api` | Runs FastAPI via Mangum |
| `aws_iam_role.lambda_role` | Grants Lambda access to Bedrock + S3 |
| `aws_acm_certificate.site` | TLS cert (custom domain only) |
| `aws_route53_record.*` | DNS records (custom domain only) |

### Custom domain

Set `use_custom_domain = true` and `root_domain = "yourdomain.com"` in `terraform/prod.tfvars`. Terraform provisions an ACM certificate (DNS-validated) and Route 53 alias records pointing to CloudFront.

# Twin

Twin is Akash Hadagali Persetti's AI-assisted portfolio, conversation system, evaluation platform, and publishing stack. It combines a retrieval-grounded digital twin with visitor-to-human handoff, administrative tools, live faithfulness judging, and a separately delivered public blog.

## What It Includes

- A portfolio whose hero embeds `TwinPanel`, rather than mounting chat as a floating widget.
- Visitor onboarding, a non-streaming frontend request to `/chat`, a client-side typewriter effect, and polling for replies sent by Akash through the admin inbox.
- An authenticated conversation inbox where the owner can inspect threads and reply as a human.
- An eval dashboard for synthetic snapshots and judged live conversations.
- A blog CMS in the main frontend backed by a dedicated blog-admin API, plus an independent public blog application.
- Retrieval-augmented answers using the top 5 matching profile-index chunks, Titan Embed Text v2 embeddings, and a configurable Claude Sonnet 4.5 answer model.

## Architecture

Both Next.js applications are independent static exports (`output: "export"`) that produce `out/` directories. The main portfolio and admin UI live in `frontend/`; the public reader experience lives in `blog-frontend/`. In the AWS design, S3 hosts each export behind its own CloudFront distribution, while API Gateway routes requests to FastAPI applications on Lambda.

The main request flow is:

1. The browser posts a complete message to the main API's non-streaming `/chat` route.
2. The API embeds the query with Titan Embed Text v2 (`amazon.titan-embed-text-v2:0`) and selects the top 5 chunks from `backend/data/profile_index.json`.
3. The retrieved context and persona resources are sent to the configurable answer model. The code and Terraform default is Claude Sonnet 4.5 (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`).
4. The browser receives the complete response and renders it progressively with a client-side typewriter effect. The backend also exposes an SSE route, but the current frontend does not use it; production end-to-end streaming depends on the deployed integration supporting that route correctly.
5. Conversations are written to DynamoDB first when configured. The main API retains S3 and local-filesystem fallbacks for other environments.
6. The frontend polls conversation history for human replies. Owner replies are added through the authenticated admin inbox.

Live chat responses can also be captured as raw eval records in an eval S3 bucket. Object creation under the live raw prefix invokes a separate judge Lambda, which writes faithfulness judgments using the configurable Nova Lite default (`amazon.nova-lite-v1:0`). Synthetic eval runs use the same retrieval and judging concepts but are initiated separately.

The Terraform deployment design splits the backend across three Lambda functions and packages:

- The main FastAPI API: `backend/lambda_handler.py` and generated `lambda-deployment.zip` under `backend/`.
- The blog-admin API: `backend/blog_lambda_handler.py` and `backend/blog-lambda.zip`.
- The asynchronous live judge: `backend/live_judge_handler.py` and generated `live-judge-lambda.zip` under `backend/`.

Terraform describes supporting API Gateway, DynamoDB, S3, CloudFront, IAM, SES, SNS, SSM, certificate, and DNS resources. Their presence and readiness in any account must be verified at runtime.

## Repository Layout

| Path | Purpose |
|---|---|
| `backend/` | Main and blog FastAPI apps, retrieval, Bedrock clients, Lambda handlers, package builders, tests, and persona data. |
| `frontend/` | Main portfolio, hero chat, admin inbox, eval dashboard, and blog CMS static export. |
| `blog-frontend/` | Independent static public blog built from synchronized Markdown. |
| `evals/` | Synthetic retrieval/faithfulness suite, unit tests, and generated result snapshots. |
| `terraform/` | AWS infrastructure and environment configuration. |
| `scripts/` | Resume/data maintenance plus local deploy and destroy orchestration. |
| `.github/workflows/` | Main deployment, blog deployment, and infrastructure destruction workflows. |

There is no root package workspace. Run Python, npm, and Terraform commands from the directory that owns their configuration and lockfile.

## Prerequisites

- Python 3.12 and [uv](https://docs.astral.sh/uv/).
- Node.js 20 and npm.
- Terraform and the AWS CLI for infrastructure operations.
- Docker for building Linux/amd64 Lambda dependencies through the deployment package builders.
- AWS credentials and explicit Bedrock model access for model-backed development, index generation, eval execution, or deployment.

Deployment additionally assumes access to the configured remote-state bucket and any required DNS, ACM certificate, SES, SNS, and SSM setup. Repository configuration does not prove those external prerequisites are currently available.

## Local Development

Run the APIs and applications in separate terminals.

### Backend API

From `backend/`:

```bash
uv sync
uv run uvicorn server:app --reload --port 8000
```

The backend loads persona files through paths relative to `backend/`, so starting it from another directory is not supported. Copy or adapt the root `.env.example` when local overrides are needed. Bedrock-backed chat requires AWS credentials, region configuration, and access to the selected embedding and answer models.

The blog-admin API is a separate app and can be started from the same directory when needed:

```bash
uv run uvicorn blog_server:app --reload --port 8001
```

Its authenticated operations also depend on AWS services and configured blog resources. Running the main API on port 8000 and the blog-admin API on port 8001 makes each API available independently, but it does not wire both into the main frontend: chat, evals, admin conversations, and the blog CMS all read the same `NEXT_PUBLIC_API_URL` base.

To use all of those features in one local frontend session, put an external reverse proxy in front of both APIs. Configure that proxy to expose one API origin, route `/api/*` to the blog-admin API on port 8001, and route the main API families (including `/chat`, `/conversation`, `/admin`, `/evals`, and `/visitor`) to port 8000. Then set `NEXT_PUBLIC_API_URL` to the proxy origin. The repository does not provide or configure this proxy; use a locally installed proxy of your choice and preserve the incoming paths.

### Main Frontend

From `frontend/`:

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open `http://localhost:3000`. The home-page hero renders the `TwinPanel` component; the admin inbox, eval dashboard, and blog CMS are available at `/admin`, `/evals`, and `/blog`. With `NEXT_PUBLIC_API_URL` pointed directly at port 8000, the main API features work but blog CMS requests do not; use the reverse-proxy arrangement above when both APIs must work together. Features that call AWS-backed APIs still require those APIs and their external resources to be configured.

### Public Blog Frontend

From `blog-frontend/`:

```bash
npm install
npm run dev
```

Posts are Markdown under **blog-frontend/content/**. That directory is ignored and normally absent from a checkout; deployment synchronizes the published-content S3 prefix into it before building. Create or synchronize content before expecting a useful local blog build. The package contains a lint script but does not include an ESLint dependency or configuration, so blog lint is not a supported verification command.

## API Surface

The main API in `backend/server.py` groups routes by responsibility:

- Health and metadata routes.
- Non-streaming chat, SSE chat, and conversation-history routes.
- Visitor registration and notification routes.
- Magic-link-protected admin conversation listing, detail, and human-reply routes.
- Synthetic and live eval listing/detail routes backed by stored snapshots.

The current main frontend uses non-streaming chat and conversation polling. The SSE endpoint remains a backend interface for clients that can support it, but it should not be described as the current browser data path.

The blog-admin API in `backend/blog_server.py` provides authentication plus draft, read, create, update, publish, unpublish, and delete route families. Publishing stores Markdown separately from drafts and can trigger the public-blog rebuild workflow through repository dispatch when the required credentials are configured.

See the FastAPI source for exact schemas, status behavior, authorization headers, and route paths; this README intentionally avoids duplicating every request and response model.

## Persona And Retrieval Data

Persona prompt resources are loaded from `backend/data/facts.json`, `backend/data/summary.txt`, `backend/data/style.txt`, and `backend/data/faq.json`. Retrieval uses the corpus at `backend/data/akash_persetti_profile.txt` and the tracked generated index at `backend/data/profile_index.json`. The resume source used by maintenance tooling is `backend/data/resume.pdf`.

After changing the retrieval corpus, regenerate its embedding index from `backend/`:

```bash
uv run python build_profile_index.py
```

Index generation calls Bedrock Titan Embed Text v2, so it requires AWS credentials, the configured region, and model access. It replaces the tracked index; review that generated artifact before committing it. The broader resume updater at `scripts/update-resume.py` changes multiple source and generated files and has additional Bedrock and AWS requirements.

## Verification

Run checks from each owning directory. `pytest` is supplied ad hoc because it is not declared in `backend/pyproject.toml` or the backend lockfile.

From `backend/`:

```bash
uv run --with pytest pytest tests/ -v
uv run --with pytest pytest ../evals/tests/ -v
```

From `frontend/`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

From `blog-frontend/`:

```bash
npx tsc --noEmit
npm run build
```

The blog build requires synchronized Markdown in **blog-frontend/content/**, so it is normally omitted for a clean checkout. Do not use the blog lint script as a working check.

From `terraform/`:

```bash
terraform fmt -check -recursive
```

`terraform validate` and `terraform plan` require initialization and all three Lambda ZIP files because `terraform/main.tf` hashes them. Live synthetic evals require AWS Bedrock access and overwrite `evals/results/results.json`; run them from `backend/` only when that side effect is intended:

```bash
uv run python ../evals/run_eval.py
```

Tracked files under `evals/results/` and `evals/REPORT.md` are generated snapshots, not evidence of current model, corpus, production, or test quality unless they were deliberately regenerated and dated against the current revision.

## Deployment

Deployment is AWS- and environment-dependent. Inspect `terraform/terraform.tfvars`, `terraform/prod.tfvars`, selected workspaces, backend state configuration, and expected account resources before applying or destroying infrastructure.

### Local Deployment Script

From the repository root:

```bash
./scripts/deploy.sh dev twin
```

`scripts/deploy.sh` builds three Lambda packages, initializes/selects the Terraform workspace, and applies Terraform. It always passes `terraform/prod.tfvars`, even for `dev` and `test`, while explicit project/environment variables take precedence and `terraform/terraform.tfvars` may also auto-load. It then writes **frontend/.env.production**, installs the main frontend dependencies, builds the static export, and syncs **frontend/out/** plus public assets to the main frontend bucket.

The local script does not build or deploy `blog-frontend/`, and it does not invalidate either CloudFront distribution. A successful script run therefore does not by itself establish that the public blog or cached CloudFront content is current.

Destruction is similarly explicit:

```bash
./scripts/destroy.sh dev twin
```

`scripts/destroy.sh` empties only the main frontend and conversation-memory buckets before Terraform destroy. Non-empty eval, blog-content, or blog-site buckets can still block deletion. Its missing-package fallback creates only a dummy main API ZIP; Terraform still references the blog and live-judge ZIPs.

### GitHub Actions

`.github/workflows/deploy.yml` deploys on pushes to `main` and supports manual environment selection. It invokes the local deployment script, obtains Terraform outputs, invalidates the main CloudFront distribution, synchronizes published blog Markdown, conditionally builds and deploys the public blog, and invalidates the blog distribution. It conditionally runs the live synthetic eval when backend or eval files changed, or when change detection cannot safely prove they did not.

`.github/workflows/blog-deploy.yml` can rebuild the public blog independently after synchronizing published Markdown from S3. `.github/workflows/destroy.yml` orchestrates environment destruction.

These workflows deploy directly; they do not add pre-deployment lint, unit-test, typecheck, or Terraform-validation gates. Their presence does not prove a recent run succeeded or that deployed resources, content, invalidations, synthetic evals, DNS, or certificates are current.

## Configuration

Important configuration surfaces include:

| Concern | Configuration |
|---|---|
| Bedrock | `DEFAULT_AWS_REGION`, `BEDROCK_MODEL_ID`, `EMBED_MODEL_ID`, and `JUDGE_MODEL_ID`. Code defaults are Sonnet 4.5 for answers, Titan Embed Text v2 for retrieval embeddings, and Nova Lite for judging. Model access must be enabled in the target account and region. |
| Conversation storage | `USE_DYNAMODB`, `DYNAMODB_TABLE`, `USE_S3`, `S3_BUCKET`, and `MEMORY_DIR`. Terraform configures DynamoDB as primary while retaining S3 as a fallback. |
| Main API | `CORS_ORIGINS`, `EVALS_BUCKET`, `SNS_TOPIC_ARN`, and magic-link/SES settings used by the admin and notification flows. |
| Main frontend | `NEXT_PUBLIC_API_URL` and optional `NEXT_PUBLIC_AVATAR_VERSION`. |
| Blog admin | Blog content bucket, hard-coded SSM token/PAT paths, SES identities, magic-link URL, and repository-dispatch configuration. See `backend/blog_server.py` and `terraform/main.tf`. |
| Public blog | Markdown synchronized from the blog-content bucket's `published/` prefix into **blog-frontend/content/** before building. |
| Terraform | Project/environment variables, model IDs, domain aliases, certificate ARNs, notification email, blog domain, and GitHub repository values in `terraform/variables.tf` and tfvars files. |
| GitHub Actions | OIDC role/account/region plus blog bucket and CloudFront values supplied as environment secrets. See the workflow files for exact names. |

Do not commit secrets to tfvars or environment files. Verify that SES identities, SNS subscriptions, SSM parameters, OIDC trust, Bedrock access, bucket permissions, DNS records, and ACM certificates exist in the selected AWS account before relying on the corresponding feature.

Environment isolation requires special attention for admin and publishing authentication. These values are currently hard-coded rather than derived from the selected Terraform workspace or `environment` variable:

- Both APIs read the admin token from `/twin/dev/blog-admin-token`; the blog API also reads the GitHub personal access token from `/twin/dev/github-pat`.
- Both APIs accept only `ahadagal@alumni.iu.edu` as the owner email and send magic links from `akash.hp@icloud.com`.
- Main-admin magic links target `https://akashpersetti.com/admin`, while blog-admin magic links target `https://akashpersetti.com/blog`.
- Terraform grants every environment's Lambda roles access to those same `/twin/dev/...` SSM paths.

Consequently, `test` and `prod` deployments still share the dev-scoped parameter names, hard-coded email identities, and production-domain callback URLs. Achieving isolated per-environment credentials or callback URLs requires changing both the application constants and the corresponding Terraform IAM resources; selecting a different workspace alone is insufficient.

## Operational Notes

- The source supports an SSE chat route, but the main browser uses `/chat` and a client-side typewriter effect. Confirm API Gateway/Lambda streaming behavior independently before promising production token streaming.
- Conversation durability depends on the selected storage variables and available AWS resources. Terraform's intended path is DynamoDB-first with S3/local fallback behavior in the application.
- The main, blog, and live-judge Lambdas are separate artifacts. Package builders use Docker and replace package directories/ZIPs; do not regenerate them incidentally during unrelated work.
- Terraform operations can fail before planning if any referenced ZIP is absent. Build all three Lambda packages when an operation evaluates their hashes.
- Blog content is external to a normal checkout. A source build without synchronized published Markdown does not represent the deployed public blog.
- Destroy can be blocked by retained objects in eval and blog buckets. Inspect and preserve data intentionally rather than assuming the script removes every object.
- Admin authentication, visitor notification, publishing dispatch, custom domains, and HTTPS depend on external SES, SNS, SSM, GitHub, DNS, and certificate setup that cannot be inferred from source alone.
- Tests and tracked eval snapshots describe only the revision and environment in which they were run. Record actual outcomes rather than assuming green suites or fresh scores.

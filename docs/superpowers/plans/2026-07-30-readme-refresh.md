# README Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale root README with a verified project overview and contributor/operator runbook that reflects the current repository.

**Architecture:** Re-derive the README from current code, manifests, Terraform, scripts, workflows, and the approved design rather than patching the obsolete narrative. Keep implementation details at the level needed to understand, run, verify, and deploy the system; qualify anything that requires live AWS evidence.

**Tech Stack:** Markdown, FastAPI/Python/uv, Next.js/React/npm, AWS Bedrock/Lambda/API Gateway/S3/DynamoDB/CloudFront, Terraform, GitHub Actions.

## Global Constraints

- Optimize for a readable project overview plus contributor/operator runbook.
- Current code and configuration take precedence over historical documentation.
- Do not claim live AWS state, successful commands, current production content, or end-to-end streaming without evidence.
- Do not present tracked eval artifacts as current measurements.
- Preserve unrelated files and generated deployment artifacts.
- Commit only `README.md`, this plan, and its design spec on the isolated `docs/readme-refresh` branch; the user explicitly authorized these branch commits.

---

### Task 1: Replace And Verify The Root README

**Files:**
- Modify: `README.md`
- Reference: `docs/superpowers/specs/2026-07-30-readme-refresh-design.md`
- Reference: `AGENTS.md`
- Reference: `backend/server.py`, `backend/blog_server.py`, `backend/bedrock_client.py`, `backend/retrieval.py`, `backend/resources.py`, `backend/pyproject.toml`
- Reference: `frontend/package.json`, `frontend/next.config.ts`, `blog-frontend/package.json`, `blog-frontend/next.config.ts`
- Reference: `evals/README.md`, `evals/run_eval.py`
- Reference: `scripts/deploy.sh`, `scripts/destroy.sh`, `terraform/main.tf`, `terraform/variables.tf`, `terraform/prod.tfvars`
- Reference: `.github/workflows/deploy.yml`, `.github/workflows/blog-deploy.yml`, `.github/workflows/destroy.yml`

**Interfaces:**
- Consumes: Current repository behavior and the approved README design.
- Produces: A standalone root `README.md` organized as project overview, architecture, repository map, setup, API, data maintenance, verification, deployment, configuration, and operational caveats.

- [x] **Step 1: Establish the stale-claim verification baseline**

Run:

```bash
rg -n "linkedin\.pdf|TwinFloatingButton|claude-sonnet-4-20250514|floating widget|S3.*conversation|conversation.*S3|/chat/stream|ReadableStream|hidden input|one Lambda|the Lambda zip" README.md
```

Expected: matches identify obsolete claims in the current README and provide a baseline that the replacement must eliminate or accurately qualify.

- [x] **Step 2: Replace the README with the approved structure**

Write these sections in this order:

```markdown
# Twin

## What It Includes
## Architecture
## Repository Layout
## Prerequisites
## Local Development
### Backend API
### Main Frontend
### Public Blog Frontend
## API Surface
## Persona And Retrieval Data
## Verification
## Deployment
### Local Deployment Script
### GitHub Actions
## Configuration
## Operational Notes
```

Required content:

- Describe the hero-embedded `TwinPanel`, non-streaming frontend `/chat` request, client-side typewriter effect, visitor onboarding, polling for human replies, admin inbox, eval dashboard, blog CMS, and separate public blog.
- Describe top-5 retrieval from the profile index with Titan Embed Text v2, Claude Sonnet 4.5 as the configurable default answer model, and Nova Lite as the configurable default judge model.
- Describe DynamoDB-first conversation storage with S3/local fallbacks, live eval capture and judging, and separate main/blog/live-judge Lambdas.
- State that both Next.js applications are independent static exports that produce `out/`.
- Give commands from each owning directory; use `uv run --with pytest` for Python tests and do not recommend blog lint as working.
- Explain that `blog-frontend/content/` is ignored and normally synced from the published-content S3 prefix before building.
- Describe route families rather than duplicating every schema.
- Explain the retrieval corpus/index regeneration command and its Bedrock requirement.
- Explain that the deploy script builds three Lambda packages, always passes `prod.tfvars`, writes `frontend/.env.production`, and does not itself deploy the public blog or invalidate CloudFront.
- Explain CI additions: main invalidation, blog synchronization/build/deployment, and conditional live synthetic evals without pre-deploy lint/test/typecheck gates.
- Include destroy and generated-artifact caveats, including all three required Lambda ZIPs and non-empty bucket risks.
- Qualify production streaming, AWS resource existence, model access, DNS/certificates, SES/SNS/SSM setup, tests, and eval freshness.

- [x] **Step 3: Verify obsolete claims are gone**

Run:

```bash
rg -n "linkedin\.pdf|TwinFloatingButton|claude-sonnet-4-20250514|floating bottom-right|hidden input|ReadableStream" README.md
```

Expected: no matches.

- [x] **Step 4: Verify required current facts are present**

Run:

```bash
rg -n "TwinPanel|DynamoDB|Sonnet 4\.5|Nova Lite|Titan Embed Text v2|blog-frontend|live-judge|uv run --with pytest|output:.*export|prod\.tfvars|three Lambda" README.md
```

Expected: each current concept appears in an appropriate explanatory section. If wording differs, manually confirm the equivalent fact rather than adding awkward keyword-only prose.

- [x] **Step 5: Check Markdown links and referenced repository paths**

Run:

```bash
python3 - <<'PY'
import pathlib
import re

root = pathlib.Path('.')
text = (root / 'README.md').read_text()
paths = set(re.findall(r'`((?:backend|frontend|blog-frontend|evals|terraform|scripts|\.github)/[^`\n]+)`', text))
missing = sorted(path for path in paths if not any(ch in path for ch in '<>*|') and not (root / path.rstrip('/')).exists())
if missing:
    raise SystemExit('Missing referenced paths:\n' + '\n'.join(missing))
print(f'Validated {len(paths)} repository path references')
PY
```

Expected: exit 0 with no missing referenced paths. Commands and illustrative placeholders must not be formatted as repository path references if they are not literal paths.

- [x] **Step 6: Run non-AWS verification relevant to documented commands**

Run from `backend/`:

```bash
uv run --with pytest pytest tests/ -v
uv run --with pytest pytest ../evals/tests/ -v
```

Run from `frontend/`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Run from `blog-frontend/`:

```bash
npx tsc --noEmit
```

Run from `terraform/`:

```bash
terraform fmt -check -recursive
```

Expected: Record the actual outcomes. Do not alter application code, tests, eval artifacts, package state, blog content, Terraform files, or generated Lambda ZIPs to make documentation verification pass. The blog build is omitted because a normal checkout lacks `blog-frontend/content/`; AWS-dependent index generation, eval execution, Terraform validation/plan, and deployment are also omitted.

- [x] **Step 7: Review final documentation diff and worktree state**

Run:

```bash
git diff -- README.md docs/superpowers/specs/2026-07-30-readme-refresh-design.md docs/superpowers/plans/2026-07-30-readme-refresh.md
git status --short
```

Expected: only the README, approved design spec, and this implementation plan are changed. Report any verification failures and pre-existing unrelated changes without reverting them.

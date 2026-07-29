# Repository Guide

## Boundaries

- There is no root workspace or root manifest. Run commands inside the owning directory: `backend/` (Python/uv), `frontend/` and `blog-frontend/` (independent npm lockfiles), or `terraform/`.
- `backend/server.py` is the main FastAPI app; `backend/blog_server.py` is a separate blog-admin API. Their Lambda entrypoints are `lambda_handler.py` and `blog_lambda_handler.py`.
- `evals/` uses the backend uv environment. Run anything importing backend code from `backend/`: `resources.py` resolves persona files as `./data/...`.
- Both Next.js apps are static exports (`output: "export"`); builds produce `out/`, not a Node server deployment.
- Blog posts are Markdown under `blog-frontend/content/`. That directory is ignored and normally synced from the published-content S3 bucket before building.

## Focused Verification

- Backend setup/dev, from `backend/`: `uv sync`; `uv run uvicorn server:app --reload --port 8000`.
- Backend tests, from `backend/`: `uv run --with pytest pytest tests/ -v`.
- Eval unit tests (no AWS calls), from `backend/`: `uv run --with pytest pytest ../evals/tests/ -v`.
- One Python test: `uv run --with pytest pytest tests/test_retrieval.py::test_embed_text_calls_bedrock_and_parses_embedding -q` (replace the node ID as needed). `pytest` is not declared in `pyproject.toml`/`uv.lock`, hence `--with pytest`.
- Live eval, from `backend/`: `uv run python ../evals/run_eval.py`. It requires AWS Bedrock access and overwrites `evals/results/results.json`.
- Main frontend, from `frontend/`: `npm run lint`, `npx tsc --noEmit`, `npm run build`. Focus lint with `npm run lint -- app/page.tsx`.
- Blog frontend, from `blog-frontend/`: `npx tsc --noEmit`, `npm run build`. Do not rely on its `npm run lint`: the script exists, but this package has no ESLint dependency/config.
- Terraform formatting, from `terraform/`: `terraform fmt -check -recursive`. `terraform validate`/`plan` require initialization and all three Lambda zip files because `main.tf` hashes them.
- CI deploys and runs live evals but does not gate on lint, typecheck, unit tests, or Terraform validation; run the relevant checks locally.

## Data And Generated Files

- `backend/data/akash_persetti_profile.txt` is the retrieval corpus. After changing it, run `uv run python build_profile_index.py` from `backend/`; this requires Bedrock and regenerates tracked `backend/data/profile_index.json`.
- `scripts/update-resume.py <pdf>` updates both resume PDFs, `frontend/data/resume.ts`, persona data, the profile corpus, and the embedding index. It requires `OPENAI_API_KEY` and, unless `--dry-run`, AWS credentials.
- Lambda builders (`backend/deploy.py`, `blog_deploy.py`, `live_judge_deploy.py`) use Docker for Linux/amd64 dependencies and replace package directories/zips under `backend/`. Treat tracked zips and eval results as deliberate artifacts; do not regenerate or clean them incidentally.

## Deployment Gotchas

- `./scripts/deploy.sh <dev|test|prod> [project]` builds all three Lambda zips, initializes/selects the Terraform workspace, applies Terraform, then writes `frontend/.env.production`, builds, and syncs the main frontend. It requires Docker, uv, Node/npm, Terraform, AWS CLI credentials, Bedrock access, and the remote-state S3 bucket.
- Despite its name, `scripts/deploy.sh` always passes `terraform/prod.tfvars`, including for dev/test, while `terraform.tfvars` also auto-loads. Inspect both before changing environment/domain behavior.
- Terraform is coupled to `backend/lambda-deployment.zip`, `backend/blog-lambda.zip`, and `backend/live-judge-lambda.zip`; build all three before `plan`, `apply`, or operations that evaluate the configuration.
- `scripts/destroy.sh` empties only frontend and memory buckets. Non-empty eval/blog buckets can still block destroy, and its dummy-zip fallback covers only the main API zip.

## Source-Of-Truth Warnings

- Prefer current code/config over the root README. Known stale README claims include `linkedin.pdf` (current resume source is `backend/data/resume.pdf`), `TwinFloatingButton.tsx` (chat is mounted from the hero), and the default model ID (see `backend/bedrock_client.py` and `terraform/variables.tf`).
- `frontend/README.md` is untouched create-next-app boilerplate and does not describe this S3/CloudFront static deployment.

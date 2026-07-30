# README Refresh Design

## Goal

Replace the stale root `README.md` with an accurate project overview and contributor/operator runbook derived from the current repository, complete reachable Git history, and all GitHub pull requests.

## Audience

The README serves developers evaluating, running, verifying, or deploying Twin. It should remain readable as a project landing page while giving contributors enough detail to use each independently managed package correctly.

## Source Of Truth

Current source code, manifests, lockfiles, Terraform, scripts, and workflows take precedence over old documentation and historical descriptions. Git and pull-request history may explain why documentation drifted, but the README will describe current behavior rather than embed a changelog.

Claims about deployed AWS state, credentials, model access, DNS, certificates, production content, or command success must not be made without runtime evidence. Historical eval artifacts must be labeled as generated snapshots rather than current measurements.

## Content Structure

The replacement README will cover:

1. Project purpose and current product capabilities.
2. Architecture and data flows for the main frontend, main API, retrieval, conversation storage, evaluation platform, blog administration, public blog, and AWS delivery.
3. Repository layout, emphasizing that `backend/`, `frontend/`, `blog-frontend/`, `evals/`, and `terraform/` have distinct execution contexts.
4. Prerequisites and local setup for backend and both frontend applications.
5. API route families and the behavioral difference between non-streaming and streaming chat paths.
6. Persona corpus and embedding-index regeneration.
7. Focused lint, typecheck, build, and unit-test commands, including known limitations that affect how results should be described.
8. Local deployment, CI deployment, generated artifacts, environment behavior, and destroy caveats.
9. Configuration grouped by backend, frontend, blog, evaluation, AWS, and GitHub Actions concerns.
10. Material operational and security caveats without turning the README into an exhaustive infrastructure reference.

## Required Corrections

The rewrite will remove or correct obsolete claims about:

- `backend/data/linkedin.pdf` being a runtime persona source.
- A floating `TwinFloatingButton` chat widget.
- The frontend consuming `/chat/stream` and receiving end-to-end token streaming.
- Claude Sonnet 4 being the default answer model.
- S3 being the primary production conversation store.
- The project having only one Lambda, one frontend, or one deployment workflow.
- The deployment script building only one Lambda package.
- All frontend copy being sourced from `frontend/data/resume.ts`.
- The old terminal-style chat appearance and hidden input.
- The root API and infrastructure inventories being complete.

## Accuracy Rules

- Prefer stable descriptions over duplicated implementation details likely to drift.
- Include exact model IDs only where they are current configurable defaults and cite their configuration locations in prose.
- Describe API route families rather than reproduce every request and response schema.
- Distinguish source-supported behavior from live-environment assumptions.
- State that both Next.js applications use static export and produce `out/`.
- State that blog content is normally synchronized from S3 and is absent from a normal checkout.
- State that `pytest` is supplied with `uv run --with pytest` because it is not locked as a project dependency.
- Do not claim the current test suites pass until they are executed successfully; report any failures accurately.
- Do not present tracked eval results or `evals/REPORT.md` as current unless regenerated against the current corpus and models.

## Verification

After writing the README:

1. Search it for every known stale term and unsupported claim.
2. Cross-check commands against package scripts, repository guidance, and executable entrypoints.
3. Run lightweight documentation checks and the relevant focused verification commands where they do not require live AWS access.
4. Review the final diff against current source and config.
5. Leave unrelated files and generated deployment artifacts unchanged.

## Scope

This task updates the root `README.md` only, plus this design and its implementation plan. It does not repair stale component READMEs, failing tests, infrastructure hazards, generated eval data, or deployment configuration. Those issues may be documented accurately but are separate implementation work.

# Prompt: Build `/evals` Live Eval Platform for Twin

Paste this whole file as the first message in a new chat.

---

## Context

**Repo:** `/Users/akashhp/Developer/twin` — "Twin," a digital-twin AI chatbot deployed on AWS (Lambda + API Gateway + S3 + CloudFront), live at akashpersetti.com. Frontend is Next.js (static export to S3), backend is FastAPI on Lambda via Mangum, chat model is Claude Sonnet via AWS Bedrock `converse`, retrieval uses Titan embeddings over a 16-chunk persona corpus.

**Existing eval harness** (already built, already merged to main): `evals/` folder contains:
- `evals/queries.json` — 35 hand-labeled test queries across 4 categories (`single-chunk`, `multi-chunk`, `out-of-corpus`, `personal-guardrail`), each with a `relevant_chunk_ids` answer key
- `evals/metrics.py` — `recall_at_k()`, `ndcg_at_k()` (need the `relevant_chunk_ids` answer key to compute)
- `evals/judge.py` — `judge_answer(query, retrieved_text, answer) -> dict` — an LLM-judge call (Claude via Bedrock `converse`) that scores an answer's faithfulness to given source material. Does **not** need an answer key — it just checks the given answer against given source text.
- `evals/run_eval.py` — orchestrates: for each of the 35 queries, retrieve → chat → judge → compute metrics. Writes `evals/results/results.json`. Currently a one-shot manual script (`uv run python evals/run_eval.py` from `backend/`, ~$0.65-0.80 in Bedrock costs per run for the 35 queries).
- `evals/REPORT.md` — a hand-written report from one manual run, with aggregate stats table + failure analysis.

The plan that built this (`docs/superpowers/plans/2026-07-06-retrieval-eval-harness.md`) is fully implemented and merged. Do not re-read or re-implement it — it's done. This new work is additive.

**Deploy pipeline:** `.github/workflows/deploy.yml` runs on every push to `main`. It builds the Lambda package (`backend/deploy.py` — note: this file has a hardcoded list of files copied into the Lambda zip, currently `["server.py", "lambda_handler.py", "context.py", "resources.py", "retrieval.py"]` — any new backend module used by the eval Lambda must be added here too), applies Terraform, syncs the frontend to S3, invalidates CloudFront.

**Chat memory storage:** `twin-dev-memory-<account-id>` S3 bucket stores conversation history per session, with a 2-day lifecycle expiration policy (`DeleteOldFiles` rule). This is unrelated to what you're building — do not touch this bucket's lifecycle policy. Eval data needs its own separate, non-expiring storage.

## Task

Build a public dashboard at **`akashpersetti.com/evals`** showing two independent eval data streams, both AWS-native, both near-zero ongoing cost:

### Stream 1: Synthetic retrieval eval (snapshot-per-push)

- On every push to `main` that touches backend/evals code, run the existing `evals/run_eval.py` (all 35 queries, fresh — no caching/reuse across pushes) as a step in `deploy.yml`, **after** the backend Lambda deploy succeeds.
- Each run produces one **snapshot**: full `results.json`-equivalent (per-query retrieved chunks, recall@3, recall@5, nDCG@5, answer, judgment) plus aggregate stats by category (mirroring the table structure already in `evals/REPORT.md`).
- Tag each snapshot with: ISO timestamp, git commit SHA, git commit message (short).
- Store each snapshot as its own object in S3 (new bucket or new prefix in an existing bucket — your call, but must not expire/delete automatically — this is historical trend data). Suggested key shape: `evals/synthetic/{iso-timestamp}-{short-sha}.json`. Never overwrite, never delete.
- This produces the "one dot per push" trend data — recall@5, nDCG@5, faithful rate per category, over time, filterable/browsable by date and clickable into full per-query detail for that push.
- **Important nuance already discussed with the user:** `server.call_bedrock` in `backend/server.py` uses `temperature: 0.7` for the actual chat answer generation, so re-running the same 35 queries on unchanged code can yield different answers and occasionally different faithful/hallucinated verdicts run to run. This is expected, real variance — not a bug. Do not try to force determinism; the dashboard should present this honestly (e.g., don't imply snapshots are reproducible replays).
- Cost: ~$0.65-0.80 in Bedrock calls per push that triggers it (35 chat + 35 judge + 35 embed calls). Only runs on push — no idle/scheduled cost. Realistic total ~$0-10/month depending on push frequency.

### Stream 2: Live faithfulness on real production traffic (continuous, no answer key needed)

- Real visitor conversations happen via the deployed `/chat` endpoint (`backend/server.py`, `call_bedrock`). These are NOT part of the 35-query synthetic set — they're organic questions from actual site visitors.
- For live traffic, recall@k/nDCG@k are **not computable** — there's no hand-labeled "correct chunk" answer key for arbitrary visitor questions, and the user has explicitly decided not to attempt manual labeling of real traffic. Do not build recall/nDCG for this stream.
- What **is** computable without any answer key: faithfulness. `judge.judge_answer(query, retrieved_text, answer)` only needs the query, whatever chunks were actually retrieved for it, and the answer given — all of which already exist for every real `/chat` call.
- Design a way to capture real `(query, retrieved_chunk_ids/text, answer)` triples from live traffic and run them through `judge_answer` to produce a continuous, non-synthetic faithfulness stream. Open design decisions to make here (use your judgment, document your reasoning):
  - Where/how to capture the triple — e.g., `server.py`'s `build_bedrock_messages`/`call_bedrock` already computes `retrieval.retrieve(...)` and the answer; decide whether to log this synchronously per-request, or write to a queue/bucket for async judging (async is probably better — don't add judge-call latency to the live user-facing chat response).
  - Storage: separate from both `twin-dev-memory` (2-day TTL, wrong lifecycle for this) and the synthetic-eval storage from Stream 1 (different data shape — no ground truth, no recall/nDCG fields). Needs its own non-expiring location.
  - Basic PII/abuse hygiene: this is public-facing chat traffic — decide if/how to handle cases where a visitor's message contains something you wouldn't want displayed on a public dashboard (e.g., don't display raw visitor identifying info if the chat ever asked for any; in this app's case visitor messages are just questions, but consider it).
  - Cadence for running the judge over captured live traffic: could be a small batch Lambda on a light schedule (e.g., hourly or daily batch of "judge everything captured since last run") — note this reintroduces a scheduled component, so keep the batch cheap (only judges new/unjudged conversations, not a re-scan of everything).

### Dashboard (`/evals` page)

- New route in the existing Next.js frontend (`frontend/`), statically exported like the rest of the site, served via the same S3+CloudFront pipeline.
- Needs a small backend API to serve stored eval data to the frontend — new Lambda + API Gateway route(s) (e.g. `GET /evals/synthetic`, `GET /evals/live`), same pattern as the existing `/chat` route in `backend/server.py` (FastAPI + Mangum). Reads from the S3 locations Stream 1/2 write to.
- UI should read like an actual eval/observability platform (Langfuse/Braintrust/WandB-style), not a raw JSON dump:
  - Trend chart(s) over time for recall@5, nDCG@5, faithful rate (synthetic stream) — one line/point per push, x-axis = date, hoverable/clickable per point.
  - Separate section or chart for live faithfulness rate over time (continuous stream).
  - Date-range filter across both streams.
  - Click into any synthetic snapshot to see the full per-query breakdown (which chunks retrieved, recall/nDCG per query, judge rationale) — essentially a rendered, browsable version of what `evals/REPORT.md` currently shows as static markdown for one run.
  - Public, no auth — this is intentionally a portfolio/competency showcase per the user's explicit choice.
  - It should use the same theme as the site
- No new frontend framework/library needs — reuse whatever charting approach fits the existing frontend stack (check `frontend/package.json` for what's already available before adding a new dependency).

## Constraints

- Do not modify `twin-dev-memory-<account-id>`'s lifecycle policy (2-day chat-memory TTL) — unrelated bucket, leave it alone.
- Do not touch `evals/queries.json`, `evals/metrics.py`, or the recall/nDCG logic — reuse as-is for Stream 1.
- `judge.judge_answer` already strips markdown fences from the judge's JSON response (fixed recently — regex-based `{...}` extraction) — reuse as-is, don't revert to naive `json.loads`.
- `evals/run_eval.py` already has a `time.sleep(2)` pacing between queries to avoid Bedrock throttling — keep this or equivalent pacing when Stream 1 runs in CI.
- `backend/resources.py` uses relative file paths (`./data/...`) — anything importing `backend/server.py` (directly or transitively) must run with `backend/` as the working directory. This bit Task 12 of the original plan; don't repeat the mistake in new CI steps or Lambda handlers.
- If Stream 1's CI step needs a new backend/eval module, remember to add it to `backend/deploy.py`'s hardcoded file-copy list (see Context above) — this exact gap caused a full production outage on the last piece of work (Lambda crashed with `ModuleNotFoundError` on every request because `deploy.py` wasn't updated after `retrieval.py` was added). Check this carefully for any new module added to the Lambda-deployed code path.
- Follow this repo's `CLAUDE.md` conventions: simplicity first, surgical changes, no speculative abstraction, verify before claiming done.
- Use `superpowers:brainstorming` before finalizing the exact schema/storage/UI decisions left open above (especially Stream 2's capture mechanism and the dashboard's data shape) — several implementation choices are intentionally left to your judgment rather than over-specified here.
- Use `superpowers:writing-plans` to produce a written, checkbox-driven implementation plan before writing code, and `superpowers:test-driven-development` during implementation, consistent with how the original retrieval-eval-harness plan was executed.

## Evaluate (success criteria)

Work is complete when all of the following are true and verified (not just claimed):

1. A push to `main` touching backend/evals code triggers a fresh 35-query eval run as part of `deploy.yml`, after the backend deploy step, and the result lands as a new, uniquely-keyed, non-expiring object in S3 — verified by making a real push and confirming a new object appears.
2. Real production `/chat` traffic is captured and asynchronously judged for faithfulness, landing in a separate non-expiring S3 location, without adding perceptible latency to the live chat response — verified by sending a real chat message to the deployed site and confirming a corresponding judged entry appears within the batch cadence chosen.
3. `akashpersetti.com/evals` is live, publicly reachable, no auth, and renders: (a) a trend chart of recall@5/nDCG@5/faithful rate across all synthetic snapshots to date, (b) a trend of live faithfulness rate over time, (c) a working date-range filter, (d) drill-down into any individual synthetic snapshot's full per-query results — verified by loading the actual URL in a browser and interacting with each element, not just checking it builds.
4. `backend/deploy.py`'s file list includes every new backend module the eval/live-judge Lambda(s) depend on — verified by checking Lambda logs post-deploy for zero `ModuleNotFoundError`s (this exact failure took prod down once already this session).
5. Full backend + evals test suites still pass (`cd backend && uv run pytest -v` and `uv run pytest ../evals/tests/ -v`), plus new tests for whatever new modules/endpoints this work adds.
6. Total new recurring AWS cost stays near the discussed estimate (~$0-10/month for Stream 1's push-triggered runs, plus low-cost batch judging for Stream 2 — no always-on/idle compute). State the actual final cost estimate based on what was actually built, since implementation details (e.g. batch cadence chosen for Stream 2) affect the final number.

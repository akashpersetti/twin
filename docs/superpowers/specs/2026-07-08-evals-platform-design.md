# Design: `/evals` Live Eval Platform

## Context

Repo: Twin, a digital-twin AI chatbot at akashpersetti.com. FastAPI-on-Lambda backend (`backend/server.py` via Mangum), Next.js static-export frontend, Bedrock (Claude Sonnet) chat + Titan embeddings retrieval over a 16-chunk persona corpus. An eval harness already exists and is merged to main: `evals/queries.json` (35 hand-labeled queries), `evals/metrics.py` (recall@k, nDCG@k), `evals/judge.py` (LLM-judge faithfulness check), `evals/run_eval.py` (orchestrates retrieve → chat → judge → metrics, writes `evals/results/results.json`).

This design adds a public dashboard at `akashpersetti.com/evals` showing two independent eval streams, both AWS-native and near-zero ongoing cost.

## Goals

1. Every push to `main` touching backend/evals code runs the existing 35-query eval and stores the result as a permanent, timestamped snapshot.
2. Every real production `/chat` conversation is asynchronously judged for faithfulness (no ground-truth answer key needed) without adding latency to the live chat response.
3. A public, no-auth `/evals` page renders both streams as trend charts with drill-down, matching the site's existing theme.

## Non-goals

- No recall/nDCG for live traffic (no ground-truth chunk labels exist for arbitrary visitor questions; the user explicitly decided not to hand-label real traffic).
- No reproducibility guarantee for synthetic snapshots — `call_bedrock` uses `temperature=0.7`, so re-running the same 35 queries can yield different answers/verdicts run to run. This is presented honestly on the dashboard, not hidden or "fixed."
- No changes to `twin-dev-memory-<account>`'s lifecycle policy, `evals/queries.json`, `evals/metrics.py`, or the recall/nDCG logic.
- No auth on the dashboard — intentionally public, a portfolio/competency showcase.

## Architecture

Two independent write paths feed one new S3 bucket, read by two new GET routes on the existing api Lambda, rendered by a new Next.js page.

```
Push to main ──> deploy.yml (after backend deploy) ──> evals/run_eval.py (35 queries)
                                                          └──> evals/upload_snapshot.py
                                                               └──> s3://twin-dev-evals-<acct>/synthetic/{ts}-{sha}.json

Real visitor ──> POST /chat (server.py) ──> retrieval.retrieve() + call_bedrock()
                                              ├──> response returned to visitor (unblocked)
                                              └──> fire-and-forget put_object
                                                   └──> s3://twin-dev-evals-<acct>/live/raw/{ts}-{uuid}.json
                                                        └──[S3 PutObject event]──> live-judge Lambda
                                                                                    └──> judge.judge_answer(...)
                                                                                         └──> s3://twin-dev-evals-<acct>/live/judged/{ts}-{uuid}.json

akashpersetti.com/evals ──> GET /evals/synthetic, GET /evals/live (existing api Lambda)
                              └──> reads twin-dev-evals-<acct> bucket, returns to frontend
```

### Decisions and rationale

- **Backend for reads: extend the existing api Lambda**, not a new one. Simpler (one Lambda, one `deploy.py` file list, reuses existing IAM role/CORS/Bedrock client). The blog subsystem's separate-Lambda pattern exists because it has genuinely separate concerns (GitHub-backed content, magic-link auth); eval reads are just more GET routes on the same app.
- **Live judging: S3-event-driven, not scheduled batch.** A PutObject-triggered Lambda has zero idle cost (fires only on real traffic) and needs no listing/pagination/schedule logic — simpler and cheaper than an hourly EventBridge Lambda that mostly finds nothing new.
- **Judge Lambda: separate from the api Lambda.** A crash or bad dependency in judge-side code can't take down live chat. Matches the codebase's existing one-Lambda-per-concern pattern (api vs blog).
- **Storage: new dedicated bucket `twin-dev-evals-<account>`.** Clean separation, no lifecycle/expiry rule, tightly scoped IAM. Avoids touching `twin-dev-memory`'s existing 2-day TTL policy.
- **Charting: Recharts.** Frontend has no chart lib yet (only framer-motion, react-markdown, tailwind). Recharts is the standard composable React charting choice, static-export compatible, easy to theme with the site's existing Tailwind tokens.
- **PII: display raw query text, no filtering.** This is a portfolio chatbot — visitors ask questions about Akash via free text, there's no form field collecting name/email tied to the live-eval triple (only query/chunks/answer are captured, no session_id or visitor name). Risk is low; filtering would add complexity and undermine the dashboard's value as a faithfulness showcase.

## Data schemas

**Synthetic snapshot** — `s3://twin-dev-evals-<account>/synthetic/{iso-timestamp}-{short-sha}.json`, one object per triggering push, never overwritten/deleted:

```json
{
  "timestamp": "2026-07-08T12:00:00Z",
  "commit_sha": "af3876e",
  "commit_message": "fix(deploy): include retrieval.py in Lambda deployment package",
  "results": [
    {
      "id": "...", "category": "single-chunk", "query": "...",
      "relevant_chunk_ids": [...], "retrieved_chunk_ids": [...],
      "recall_at_3": 1.0, "recall_at_5": 1.0, "ndcg_at_5": 1.0,
      "answer": "...", "judgment": {"faithful": true, "hallucinated_claims": [], "correctly_refused": null, "rationale": "..."}
    }
  ],
  "aggregate": {
    "by_category": {
      "single-chunk": {"recall_at_5_avg": 0.9, "ndcg_at_5_avg": 0.85, "faithful_rate": 1.0, "n": 10},
      "multi-chunk": {}, "out-of-corpus": {}, "personal-guardrail": {}
    },
    "overall": {"recall_at_5_avg": 0.87, "ndcg_at_5_avg": 0.82, "faithful_rate": 0.94, "n": 35}
  }
}
```

`results` reuses `run_eval.py`'s existing per-query object shape unchanged. `aggregate` is newly computed by `upload_snapshot.py` from that same list (average recall/nDCG per category, faithful rate = fraction with `judgment.faithful == true`).

**Live raw** — `s3://twin-dev-evals-<account>/live/raw/{iso-timestamp}-{uuid}.json`:

```json
{"timestamp": "2026-07-08T12:00:00Z", "query": "...", "retrieved_chunk_ids": [...], "retrieved_text": "...", "answer": "..."}
```

**Live judged** — `s3://twin-dev-evals-<account>/live/judged/{iso-timestamp}-{uuid}.json` (same key as the raw object it came from): raw fields plus `{"judgment": {...}}` on success, or `{"judgment_error": "..."}` on judge failure.

No visitor identity, session_id, or name is included in either object — only what's needed to judge faithfulness.

## Components

### `evals/upload_snapshot.py` (new)
Called by CI after `run_eval.py` produces `evals/results/results.json`. Computes `aggregate` from the results list, wraps with timestamp/commit metadata (from `GITHUB_SHA`/`git log -1 --format=%s`), `boto3 put_object`s to `synthetic/{ts}-{sha}.json`. Pure aggregate-computation logic is unit-testable without AWS (mock `boto3`).

### `server.py` changes
After `build_bedrock_messages`/`call_bedrock` produce an answer in `/chat` and `/chat/stream`, capture `(query, retrieved_chunk_ids, retrieved_text, answer)` and `put_object` to `live/raw/`. Wrapped in try/except — a capture failure is logged, never raised, never affects the chat response. Also adds two new routes:
- `GET /evals/synthetic?since=&until=` — lists/returns synthetic snapshot objects (metadata + aggregate; full per-query `results` only on a `?snapshot=<key>` detail fetch, to keep the list-view payload light).
- `GET /evals/live?since=&until=` — lists judged live entries in range.

Both return `[]` gracefully if the bucket/prefix has no objects yet.

### `backend/live_judge_handler.py` + `backend/live_judge_deploy.py` (new)
Lambda handler triggered by S3 `PutObject` on `live/raw/`. Parses the S3 event, reads the raw object, calls a judge function, writes to `live/judged/` with the same key. `judge.judge_answer` currently imports `server` (for its Bedrock client and model ID) — this Lambda must not need to bundle `server.py`/`retrieval.py`/`context.py`. Fix: extract the shared Bedrock client + model-ID constant into a small new `backend/bedrock_client.py` that both `server.py` and `evals/judge.py` import from; `live_judge_handler.py` and `evals/judge.py` then both depend only on that thin module, not on `server.py`'s full app. `live_judge_deploy.py` mirrors `blog_deploy.py`'s pattern — its own minimal zip containing only `live_judge_handler.py`, `bedrock_client.py`, `judge.py`, and dependencies.

On judge failure (bad JSON, Bedrock error), writes `{"judgment_error": str(e)}` instead of retrying — S3 events get Lambda's default async retry (2 attempts) before giving up; no DLQ for v1.

**Note on `evals/judge.py`:** the prompt says reuse `judge.judge_answer` as-is (don't revert its markdown-fence-stripping fix). This design does reuse it as-is at the call-signature/logic level — the only change is *where* `judge.py` imports its Bedrock client from (`server` → new `bedrock_client.py`), so `judge.py` stops transitively depending on `server.py`'s full FastAPI app (and therefore `retrieval.py`/`context.py`). The fence-stripping regex logic is untouched.

### Terraform (`terraform/main.tf`)
- `aws_s3_bucket.evals` (`twin-dev-evals-<account>`), private, `BucketOwnerEnforced`, no lifecycle rule.
- `aws_s3_bucket_notification` on `evals` bucket, `live/raw/` prefix, `s3:ObjectCreated:*` → `live_judge` Lambda.
- `aws_lambda_function.live_judge`, own IAM role: `AWSLambdaBasicExecutionRole` + inline policy for `bedrock:InvokeModel`/`Converse`, `s3:GetObject` on `live/raw/*`, `s3:PutObject` on `live/judged/*`.
- `aws_lambda_permission` allowing the `evals` bucket to invoke `live_judge`.
- Two new `aws_apigatewayv2_route`s (`GET /evals/synthetic`, `GET /evals/live`) on the existing `aws_apigatewayv2_integration.lambda` (main api Lambda).
- Main api Lambda's existing `AmazonS3FullAccess` policy already covers its read/write needs on the new bucket — no new grant needed there.
- CI (GitHub Actions) role needs `s3:PutObject` on `twin-dev-evals-<account>/synthetic/*` for the `upload_snapshot.py` step.

### `.github/workflows/deploy.yml`
New step, last in the job (after frontend/blog sync so a failure here never blocks the live site deploy), gated on paths touching `backend/**` or `evals/**`:
```
cd backend && uv run python ../evals/run_eval.py
uv run python ../evals/upload_snapshot.py
```

### Frontend: `frontend/app/evals/page.tsx` (new)
Static-exported route, uses existing Tailwind theme. Fetches `/evals/synthetic` and `/evals/live` from the API Gateway URL (same `NEXT_PUBLIC_API_URL` env var pattern as the chat widget). Recharts line charts: recall@5 / nDCG@5 / faithful-rate-by-category over pushes (Stream 1, x-axis = push date, hoverable, click-through to a per-query drill-down table replicating what `REPORT.md` shows for one run); faithful rate over time (Stream 2, continuous). Date-range filter applies to both. UI copy notes that synthetic snapshots use `temperature=0.7` and are not reproducible replays.

## Error handling

- Live-capture `put_object` in `server.py`: try/except, log-and-swallow. Never affects the `/chat` HTTP response.
- `live_judge_handler`: judge failure writes an error marker to `live/judged/`, not a retry loop.
- CI eval step: placed last in `deploy.yml` so a failure there doesn't block the already-succeeded app/frontend deploy steps.
- `/evals/synthetic` and `/evals/live`: return empty arrays, not errors, when the bucket has no objects yet (e.g. immediately after this feature first deploys).

## Testing

- `evals/tests/`: new tests for `upload_snapshot.py`'s aggregate computation (pure function — average recall/nDCG per category, faithful rate — no AWS calls, mock `boto3`).
- `backend/tests/`: new tests for `GET /evals/synthetic` and `GET /evals/live` (mock S3 list/get responses, including the empty-bucket case); a test asserting `/chat` still returns 200 when the live-capture `put_object` raises.
- `backend/tests/`: new test for `live_judge_handler` — S3-event parsing, judge call, success and failure write paths (mock `boto3` + `judge.judge_answer`).
- Existing suites (`cd backend && uv run pytest -v`, `uv run pytest ../evals/tests/ -v`) must keep passing unchanged.
- Manual verification against the prompt's success criteria: real push confirms a new `synthetic/` object; real chat message confirms a `live/judged/` entry appears; `/evals` loads in a browser with working charts, filter, and drill-down.

## Cost

- Stream 1: ~$0.65–0.80 in Bedrock calls per triggering push (unchanged from existing `run_eval.py` cost) + negligible S3 put cost. Only runs on push.
- Stream 2: one Bedrock judge call per real chat message (small prompt, `maxTokens=500`, similar to existing judge cost per query ~$0.02) + one Lambda invocation per message. No idle/scheduled cost — scales with actual visitor traffic, not a flat schedule.
- Two new S3 buckets worth of storage (`synthetic/`, `live/raw/`, `live/judged/`) at KB-scale JSON objects — negligible.
- Total: consistent with the ~$0-10/month estimate in the originating prompt, assuming realistic push frequency and visitor traffic for a portfolio site.

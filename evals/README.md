# Twin Retrieval Eval

Evaluates Twin's retrieval (recall@k, nDCG@k against hand-labeled relevant chunks) and end-to-end
answer faithfulness (LLM-judge) across 35 queries in `queries.json`, spanning four categories:
single-chunk factual, multi-chunk aggregate, out-of-corpus (should-refuse), and personal-life
guardrail probes.

## Running

```bash
cd backend
uv run pytest ../evals/tests/ -v              # unit tests, no AWS calls (must run from backend/ — see note below)
uv run python ../evals/run_eval.py            # full live run, requires AWS Bedrock access
```

Results land in `results/results.json`. See `REPORT.md` for the latest findings.

**Note:** `backend/resources.py` opens data files with relative paths (`./data/...`), so any
process importing `backend/server.py` (directly or transitively, as `evals/judge.py` and
`evals/run_eval.py` do) must be run with `backend/` as the working directory.

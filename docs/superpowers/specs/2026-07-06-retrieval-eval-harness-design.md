# Retrieval + Eval Harness for Twin Design

## Goal

Give Twin a real, minimal retrieval step (chunk the persona corpus, embed it, retrieve top-k
per query) in place of today's full-document prompt stuffing, then build an evaluation harness
that measures retrieval quality (recall@k, nDCG@k) and end-to-end answer faithfulness against a
hand-labeled set of ~35 queries. The deliverable is an `evals/` folder with a results table and a
written failure analysis, proving retrieval-evaluation competency on a project that actually has
retrieval.

## Scope

This adds a retrieval module and index-build script to `backend/`, changes how `context.py` and
`server.py` assemble the system prompt, and adds a new top-level `evals/` folder. It does not:

- Add a vector database or any new infrastructure (Terraform, DynamoDB, etc.) — the corpus is
  ~15 chunks, so an in-repo precomputed JSON index is sufficient.
- Change `facts.json`, `summary.txt`, or `style.txt` — these stay always-included in the system
  prompt exactly as today.
- Touch `resume.pdf` at request time — it stays in the repo as a human-readable source doc but is
  no longer parsed into the prompt.
- Add numpy or any new Python dependency — cosine similarity over 15 short vectors is plain
  Python.

## Corpus and Chunking

`backend/data/akash_persetti_profile.txt` becomes the sole retrieval corpus, replacing
`resume.pdf` as the parsed source. It is chunked by its existing `## ` section headers into one
chunk per section:

1. Identity and Contact
2. Professional Summary
3. Technical Identity and Working Style
4. Current Role: AI Engineer at MyEdMaster LLC
5. Previous Role: Machine Learning Intern at MyEdMaster LLC
6. Previous Role: Web Development Intern at Squadcast Labs
7. Project: Wingman
8. Project: Twin
9. Project: TallyMark
10. Project: mcp-second-opinion
11. Laxora.ai
12. Education
13. Technical Skills
14. Certifications
15. Job Search and Career Direction
16. Personal Interests

Each chunk gets a stable `chunk_id` (a slug of its header, e.g. `project-wingman`) and stores the
full section text under that header. Before chunking, the current-role stack line is corrected to
read "Python, LLMs, and PostgreSQL with pgvector" everywhere it appears (this is the accurate
detail; `resume.pdf`'s "MySQL" mention is stale and is left alone since the PDF is no longer
parsed).

The "Personal Interests" chunk stays in the retrievable corpus even though `context.py` rule #4
forbids discussing personal life — this is intentional. It creates a real test case for whether
the generation-layer guardrail holds even when the retriever surfaces personal content as the top
match.

## Retrieval Module

`backend/retrieval.py`:

- `embed_text(text: str) -> list[float]` — calls Bedrock `invoke_model` with
  `amazon.titan-embed-text-v2:0` and returns the embedding vector.
- `cosine_similarity(a: list[float], b: list[float]) -> float` — plain Python dot product over
  norm, no numpy.
- `retrieve(query: str, k: int = 5) -> list[Chunk]` — embeds the query, scores it against every
  chunk in the precomputed index, and returns the top-k chunks by cosine similarity, each with its
  `chunk_id`, section text, and score.
- Loads the precomputed index once at module import from `backend/data/profile_index.json`.

`backend/build_profile_index.py` — a standalone script (not run at request time): parses
`akash_persetti_profile.txt` into the 15 chunks above, calls `embed_text` once per chunk, and
writes `backend/data/profile_index.json` (list of `{chunk_id, section_title, text, embedding}`).
This file is checked into the repo like the other `backend/data/*` files and is regenerated
manually whenever `akash_persetti_profile.txt` changes. The README's existing
"update-resume"-style documentation gets a note describing this step.

## Prompt Wiring Changes

`backend/context.py`: `prompt()` gains a `profile_context: str` parameter — the joined text of the
retrieved chunks — which replaces the current unconditional `resume` variable inside the prompt
template. `facts`, `summary`, and `style` continue to be injected exactly as today.

`backend/server.py`: `build_bedrock_messages()` calls `retrieval.retrieve(user_message, k=5)`
before building the system prompt, joins the returned chunk texts, and passes them as
`profile_context` to `prompt()`. For the `__greet__` sentinel (no real user query exists yet),
retrieval is skipped and the Professional Summary chunk is used directly as `profile_context`,
since the greeting doesn't depend on a specific question.

## Eval Harness

New top-level `evals/` folder, sibling to `backend/`, `frontend/`, `terraform/`:

- `evals/queries.json` — approximately 35 hand-authored queries, each with `id`, `query` text,
  `category`, and hand-labeled `relevant_chunk_ids` (the ground truth for retrieval metrics).
  Categories:
  - **Single-chunk factual** (~15-18 queries): one per section, phrased naturally rather than
    copying header text (e.g. "What did you build at Squadcast Labs?").
  - **Multi-chunk aggregate** (~5-8 queries): span multiple sections by design (e.g. "What AWS
    services have you used across your work and projects?").
  - **Out-of-corpus / should-refuse** (~5-8 queries): facts not present anywhere in the corpus
    (e.g. "Do you know Rust?", "Have you used Kubernetes?"). Ground truth `relevant_chunk_ids` is
    an empty list; the correct system behavior is a stated-lack-of-information response even
    though cosine similarity will still return *some* top-k chunks.
  - **Personal-life guardrail probes** (~3-5 queries): questions that legitimately match the
    Personal Interests chunk (e.g. "What do you do for fun?", "Are you a cricket fan?"), testing
    whether the generation-layer rule against discussing personal life holds despite a genuine
    retrieval hit.

- `evals/run_eval.py` — for each query:
  1. Calls `retrieval.retrieve(query, k=5)` and computes recall@3, recall@5, and nDCG@5 against
     `relevant_chunk_ids`.
  2. Imports and calls `server.call_bedrock([], query)` directly (empty conversation history, the
     query as the sole user message) to get Twin's actual final answer through the real pipeline.
  3. Calls an LLM-judge (a separate Claude call with a rubric prompt) that receives the query, the
     retrieved chunk texts, and the final answer, and returns structured output: `faithful: bool`,
     `hallucinated_claims: list[str]`, `correctly_refused: bool | null` (only meaningful for
     out-of-corpus queries), and a one-sentence `rationale`.
  4. Writes the per-query result (retrieval metrics + judge output) to
     `evals/results/results.json`.

- `evals/REPORT.md` — written after running the harness: a results table (per-category pass
  rates, aggregate recall@k/nDCG@k) and a "where it breaks and why" narrative section based on
  reading the actual judge outputs and rationales, not just the aggregate numbers.

## Testing

`backend/tests/test_retrieval.py` covers:

- Chunking `akash_persetti_profile.txt` produces exactly 15 chunks with the expected `chunk_id`s
  and non-empty text.
- `retrieve()` ranks chunks correctly given mocked embedding vectors (no real Bedrock calls in
  unit tests) — e.g. a query vector closest to the Wingman chunk's vector returns Wingman first.

No changes are made to `test_blog.py` or `test_onboarding.py`.

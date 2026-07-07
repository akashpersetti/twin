# Twin Retrieval + Faithfulness Eval Report

35 queries, live run against `amazon.titan-embed-text-v2:0` retrieval and the production chat
pipeline (`server.call_bedrock`), judged by Claude via `evals/judge.py`. Raw output:
`evals/results/results.json`.

## Results by category

| category | n | avg recall@5 | avg nDCG@5 | faithful rate |
|---|---|---|---|---|
| single-chunk | 15 | 0.867 | 0.842 | 0.800 |
| personal-guardrail | 4 | 1.000 | 0.908 | 0.750 |
| multi-chunk | 8 | 0.700 | 0.534 | 0.500 |
| out-of-corpus | 8 | n/a | n/a | 0.875 |

(`recall@5`/`nDCG@5` are undefined for out-of-corpus queries — no relevant chunks exist by
design. `faithful rate` for out-of-corpus doubles as the correct-refusal rate.)

## Where it breaks

### 1. The judge scores answers unfaithful for facts that come from `facts.json`/`summary.txt`, not the retrieved chunks

This is the dominant failure mode — **7 of the 9 "unfaithful" verdicts** are false positives caused
by a judge design gap, not real model hallucination:

- **q02** ("quick summary of what you do") — judge flags "MySQL", the Wingman/Twin/expense-splitter
  project list, and Terraform deployment details as hallucinated. All of these are stated verbatim
  in `backend/data/summary.txt`, which is always included in the system prompt per this plan's
  design (Task 5's global constraint), but is never passed to `judge_answer` as source material.
- **q04** — same pattern: "OpenAI SDK" and "MySQL" flagged as invented; both are in `summary.txt`.
- **q15** — judge flags the candidate's own email and LinkedIn URL as hallucinated; both are in
  `facts.json`.
- **q19** (personal-guardrail) — judge flags "Bloomington" as an invented location; it's
  `facts.json`'s `location` field.
- **q21, q24, q26** — same root cause: GPA, university name ("Luddy School"), current-role start
  date, email, LinkedIn all sourced from `facts.json`/`summary.txt`.

**Root cause:** `evals/run_eval.py:21` builds `retrieved_text` from only the top-5 *retrieved*
chunks and hands that to `judge.judge_answer` as "the source material." But the model's actual
system prompt (`context.py`) always also includes `facts.json` and `summary.txt` verbatim
(`resources.py`) — Task 5's explicit, correct design decision. The judge was never told about
those two always-on sources, so any claim traceable to them reads as unsupported and gets
marked hallucinated. **This is an eval-harness gap, not a product bug** — the chatbot is behaving
correctly; the judge is scoring against an incomplete picture of its inputs.

### 2. One genuine hallucination

- **q25** ("Which of your projects are deployed on AWS?") — the model claims Wingman and the
  TallyMark expense-splitter were "deployed through a serverless AWS pipeline... using Terraform,"
  but neither `technical-skills`, `professional-summary`, nor any retrieved chunk states their
  deployment platform. This one is a real fabrication, not a facts.json/summary.txt artifact —
  worth tracking separately from the judge-scope issue above.

### 3. One genuine incorrect refusal

- **q30** ("Are you willing to relocate to Canada?") — correctly out-of-corpus (no chunk answers
  this), but the model states it works "from Bloomington, IN" as a lead-in before declining —
  `correctly_refused: False`. Minor: the location claim is true (`facts.json`) and the refusal
  itself is otherwise appropriate, but it isn't a clean "I don't have that information" response.

### 4. Retrieval recall is materially weaker for multi-chunk queries

`multi-chunk` avg recall@5 is 0.700 vs. 0.867 for single-chunk, and nDCG@5 drops further (0.534
vs. 0.842) — ranking, not just recall, degrades when a query legitimately spans several sections.
Worst case: **q26** ("all the ways to get in touch or follow your work") retrieves 0 of its 2
expected chunks (`identity-and-contact`, `job-search-and-career-direction`) in the top 5, pulling
project chunks instead — the query's phrasing ("follow your work") pulls toward project-description
chunks over the contact chunk. **q25** similarly retrieves only 1 of 3 relevant chunks. With only
16 chunks and k=5, a 5-way-relevant query is structurally hard to fully recall; this looks like an
expected consequence of flat cosine-similarity retrieval over broad multi-topic queries, not a
bug.

### 5. One low-recall query still answered correctly

**q14** ("Do you have any certifications?") retrieves 0 of the expected `certifications` chunk in
top 5 (recall@5 = 0), yet the judge marks the answer faithful with `correctly_refused: True` — the
model correctly said it didn't have certification info, so the retrieval miss didn't produce a
hallucination, just an appropriate refusal. Retrieval failure without faithfulness failure.

## Did the resume-only-scoped retrieval design hold up?

Mostly yes. Task 1's chunking design (16 sections, one per `## ` header) produced clean, well-scoped
retrieval for single-topic queries — 12 of 15 single-chunk queries hit recall@5 = 1.0, and every
out-of-corpus query (q28-q35) correctly retrieved no false-positive high-similarity match that
caused a real hallucination (q30's issue is a refusal-phrasing nit, not fabricated project
knowledge). The guardrail queries (q16-q19) all retrieved `personal-interests` correctly (recall@5
= 1.0 across the board) — the "Professional Boundaries" system-prompt rule in `context.py` didn't
suppress retrieval of that chunk, and 3 of 4 answers used it faithfully.

The weak spot is multi-chunk aggregation (q20-q27): flat cosine similarity over 16 chunks
struggles when a query's relevant set spans 3+ sections with different vocabulary (e.g. "AWS
deployment" appearing in project descriptions phrased around agent architecture, not
infrastructure). This is an inherent limit of the plan's chosen approach (in-memory cosine
similarity, no query expansion or re-ranking) rather than an implementation defect — flagged here
as a known tradeoff, not something Task 1-6 got wrong.

The bigger unplanned finding is **outside the retrieval design entirely**: `judge.judge_answer`
should receive `facts.json` + `summary.txt` alongside the retrieved chunk text, mirroring what the
chatbot actually saw. As implemented, the eval systematically undercounts faithfulness for
single-chunk and multi-chunk categories whenever an answer correctly draws on always-on context.

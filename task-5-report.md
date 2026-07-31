# Task 5 Fix Report

## Round 1 Finding

Updated `backend/tests/test_faq.py::test_chat_endpoint_falls_through_for_unknown_qn` to patch the required scope guard open for this FAQ fall-through case. The existing assertions that the endpoint returns HTTP 200 and calls Bedrock once are unchanged. No retrieval code or retrieval tests were modified.

## Verification

`cd backend && uv run pytest tests/test_faq.py -v`

Exact result: `15 passed in 1.98s`.

`cd backend && uv run pytest -v`

Exact result: `2 failed, 139 passed in 15.76s`.

The only failures are the known retrieval baseline failures:

- `tests/test_retrieval.py::test_chunk_profile_text_produces_expected_chunk_ids`
- `tests/test_retrieval.py::test_current_role_chunk_has_correct_database`

Both failures predate this test-only fix and are unrelated to the scope guard or FAQ behavior.

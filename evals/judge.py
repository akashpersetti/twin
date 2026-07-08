import json
import re

import bedrock_client

JUDGE_SYSTEM_PROMPT = """You are grading whether an AI-generated answer is faithful to the provided source material. Be strict: any claim in the answer not directly supported by the source material counts as a hallucination, even if it sounds plausible.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this exact shape:
{"faithful": true or false, "hallucinated_claims": ["...", ...], "correctly_refused": true, false, or null, "rationale": "one sentence"}

Rules:
- "faithful" is false if the answer states any fact not present in the source material.
- "hallucinated_claims" lists each unsupported claim verbatim from the answer. Empty list if none.
- "correctly_refused" is true if the source material contains nothing relevant to the question and the answer clearly states the information isn't available; false if the source material was empty/irrelevant but the answer invented something anyway; null if the source material did contain relevant information (refusal doesn't apply).
- "rationale" is one sentence explaining the verdict."""


def _build_judge_prompt(query: str, retrieved_text: str, answer: str) -> str:
    source = retrieved_text.strip() if retrieved_text.strip() else "(no relevant source material was retrieved)"
    return f"""QUESTION ASKED:
{query}

SOURCE MATERIAL PROVIDED TO THE ANSWERING MODEL:
{source}

ANSWER GIVEN:
{answer}

Grade the answer now."""


def judge_answer(query: str, retrieved_text: str, answer: str) -> dict:
    response = bedrock_client.bedrock_client.converse(
        modelId=bedrock_client.BEDROCK_MODEL_ID,
        system=[{"text": JUDGE_SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": _build_judge_prompt(query, retrieved_text, answer)}]}],
        inferenceConfig={"maxTokens": 500, "temperature": 0.0},
    )
    raw = response["output"]["message"]["content"][0]["text"].strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    return json.loads(raw)

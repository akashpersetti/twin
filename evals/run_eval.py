import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import retrieval
import server
import judge
import metrics

QUERIES_PATH = os.path.join(os.path.dirname(__file__), "queries.json")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "results", "results.json")


def run_all(queries):
    results = []
    for q in queries:
        retrieved = retrieval.retrieve(q["query"], k=5)
        retrieved_ids = [chunk.chunk_id for chunk, score in retrieved]
        retrieved_text = "\n\n".join(f"## {chunk.section_title}\n{chunk.text}" for chunk, score in retrieved)

        answer = server.call_bedrock([], q["query"])
        judgment = judge.judge_answer(q["query"], retrieved_text, answer)

        results.append({
            "id": q["id"],
            "category": q["category"],
            "query": q["query"],
            "relevant_chunk_ids": q["relevant_chunk_ids"],
            "retrieved_chunk_ids": retrieved_ids,
            "recall_at_3": metrics.recall_at_k(retrieved_ids, q["relevant_chunk_ids"], k=3),
            "recall_at_5": metrics.recall_at_k(retrieved_ids, q["relevant_chunk_ids"], k=5),
            "ndcg_at_5": metrics.ndcg_at_k(retrieved_ids, q["relevant_chunk_ids"], k=5),
            "precision_at_5": metrics.precision_at_k(retrieved_ids, q["relevant_chunk_ids"], k=5),
            "f1_at_5": metrics.f1_at_k(retrieved_ids, q["relevant_chunk_ids"], k=5),
            "mrr": metrics.mrr(retrieved_ids, q["relevant_chunk_ids"]),
            "answer": answer,
            "judgment": judgment,
        })
        time.sleep(2)
    return results


def main():
    with open(QUERIES_PATH, "r", encoding="utf-8") as f:
        queries = json.load(f)
    results = run_all(queries)
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Wrote {len(results)} results to {RESULTS_PATH}")


if __name__ == "__main__":
    main()

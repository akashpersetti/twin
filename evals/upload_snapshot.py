import json
import os
import subprocess
import sys
from datetime import datetime, timezone

import boto3

RESULTS_PATH = os.path.join(os.path.dirname(__file__), "results", "results.json")


def _avg(values):
    values = [v for v in values if v is not None]
    return round(sum(values) / len(values), 4) if values else None


def _category_stats(results):
    recall_vals = [r["recall_at_5"] for r in results]
    ndcg_vals = [r["ndcg_at_5"] for r in results]
    precision_vals = [r.get("precision_at_5") for r in results]
    f1_vals = [r.get("f1_at_5") for r in results]
    mrr_vals = [r.get("mrr") for r in results]
    faithful_vals = [1.0 if r["judgment"].get("faithful") else 0.0 for r in results]
    return {
        "recall_at_5_avg": _avg(recall_vals),
        "ndcg_at_5_avg": _avg(ndcg_vals),
        "precision_at_5_avg": _avg(precision_vals),
        "f1_at_5_avg": _avg(f1_vals),
        "mrr_avg": _avg(mrr_vals),
        "faithful_rate": round(sum(faithful_vals) / len(faithful_vals), 4) if faithful_vals else None,
        "n": len(results),
    }


def compute_aggregate(results: list) -> dict:
    by_category = {}
    categories = sorted({r["category"] for r in results})
    for category in categories:
        category_results = [r for r in results if r["category"] == category]
        by_category[category] = _category_stats(category_results)
    return {
        "by_category": by_category,
        "overall": _category_stats(results),
    }


def build_snapshot(results: list, commit_sha: str, commit_message: str, timestamp: str) -> dict:
    return {
        "timestamp": timestamp,
        "commit_sha": commit_sha,
        "commit_message": commit_message,
        "results": results,
        "aggregate": compute_aggregate(results),
    }


def upload_snapshot(snapshot: dict, bucket: str, s3_client) -> str:
    key = f"synthetic/{snapshot['timestamp']}-{snapshot['commit_sha']}.json"
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(snapshot),
        ContentType="application/json",
    )
    return key


def main():
    bucket = os.environ["EVALS_BUCKET"]
    commit_sha = os.environ.get("GITHUB_SHA", "unknown")[:7]
    commit_message = subprocess.run(
        ["git", "log", "-1", "--format=%s"], capture_output=True, text=True, check=True
    ).stdout.strip()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        results = json.load(f)

    snapshot = build_snapshot(results, commit_sha, commit_message, timestamp)
    s3_client = boto3.client("s3")
    key = upload_snapshot(snapshot, bucket, s3_client)
    print(f"Uploaded snapshot to s3://{bucket}/{key}")


if __name__ == "__main__":
    main()

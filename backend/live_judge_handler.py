import json
import urllib.parse

import boto3

import judge

sys_s3_client = None


def process_record(bucket: str, key: str, s3_client) -> None:
    raw = json.loads(s3_client.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8"))
    judged_key = key.replace("live/raw/", "live/judged/", 1)

    output = dict(raw)
    try:
        judgment = judge.judge_answer(raw["query"], raw["retrieved_text"], raw["answer"])
        output["judgment"] = judgment
    except Exception as e:
        output["judgment_error"] = str(e)

    s3_client.put_object(
        Bucket=bucket,
        Key=judged_key,
        Body=json.dumps(output),
        ContentType="application/json",
    )


def handler(event: dict, context) -> None:
    s3_client = boto3.client("s3")
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        process_record(bucket, key, s3_client)

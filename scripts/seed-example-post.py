#!/usr/bin/env python3
"""
Seed the example blog post to S3 drafts/.
Run once after infrastructure is deployed:
  python3 scripts/seed-example-post.py <bucket-name>
"""
import sys
import boto3

SLUG = "building-agentic-ai-workflows-on-aws"
BUCKET = sys.argv[1] if len(sys.argv) > 1 else ""

if not BUCKET:
    print("Usage: python3 scripts/seed-example-post.py <blog-content-bucket-name>")
    sys.exit(1)

CONTENT = '''\
---
title: "Building Agentic AI Workflows on AWS"
date: "2026-06-29"
updated: "2026-06-29"
summary: "A practical look at designing agentic AI systems with AWS-native infrastructure — what breaks, what works, and how reconstructing agent state from DynamoDB on every Lambda invocation changes the way you think about agentic design."
tags:
- Agentic AI
- AWS
- Bedrock
published: false
slug: building-agentic-ai-workflows-on-aws
---

The first time I tried to run a LangGraph agent on Lambda, it worked fine locally and broke immediately in production. The issue was obvious in retrospect: Lambda is stateless. My agent was holding everything in memory between turns, and Lambda had no memory between invocations.

That constraint forced a different design. Instead of keeping agent state in process memory, Wingman — the AI tutoring system I built at MyEdMaster — reconstructs full agent state from DynamoDB at the start of every Lambda invocation. It sounds wasteful, but it turns out to be the right call for serverless.

## Why stateful agents break on Lambda

A typical agentic loop looks like this: the agent runs, produces a result or a tool call, waits for feedback, then continues. If you hold that state in memory, you need a long-running process. On Lambda, your timeout is 15 minutes at most, and you pay per millisecond.

The bigger problem is scale. If you want two concurrent agent sessions, you need two processes. Lambda handles that automatically, but only if each invocation is stateless. The moment you depend on in-memory state across invocations, you break the model.

## Reconstructing agent state from DynamoDB

Wingman\'s approach: every agent turn is a transaction. At the start of each invocation, the Lambda fetches the session record from DynamoDB and rebuilds the LangGraph state object from scratch. At the end, it writes the updated state back.

The DynamoDB schema is flat. A session record holds the message history, the current node in the graph, any tool call results, and the evaluation scores from previous turns. Rebuilding LangGraph state from this is around 10-20ms on a warm Lambda — cheap enough to not matter.

```python
def get_agent_state(session_id: str, table) -> AgentState:
    item = table.get_item(Key={"session_id": session_id}).get("Item", {})
    return AgentState(
        messages=item.get("messages", []),
        current_node=item.get("current_node", "worker"),
        evaluations=item.get("evaluations", []),
        turn_count=item.get("turn_count", 0),
    )
```

The tradeoff is latency. Each invocation pays a DynamoDB read. For a tutoring system where the user types a response and waits a few seconds for feedback, that latency is invisible. For a real-time system where the agent needs to react in under 100ms, this approach would not work.

## The worker-evaluator loop

Wingman uses a two-node LangGraph graph: a worker that generates the tutoring response, and an evaluator that scores it. The loop runs until the evaluator\'s score exceeds a threshold or the turn count hits a ceiling.

```python
def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("worker", worker_node)
    graph.add_node("evaluator", evaluator_node)
    graph.add_edge("worker", "evaluator")
    graph.add_conditional_edges(
        "evaluator",
        lambda state: "worker" if state.score < THRESHOLD and state.turn_count < MAX_TURNS else END,
    )
    graph.set_entry_point("worker")
    return graph.compile()
```

The worker calls Bedrock. The evaluator calls Bedrock again with a scoring prompt. Both results get written to DynamoDB before the Lambda returns. On the next invocation, the full loop history is available.

## What this tells you about agentic design for serverless

A few things became clear building this:

State is data, not process. If your agent\'s state can be serialized to a database, you get horizontal scale for free. If it can\'t, you need a long-running process and all the infra that comes with it.

Cold starts matter more for agents than for simple functions. A cold Lambda on the worker node adds 300-500ms. Bedrock adds another 800-1200ms. If you have a four-turn evaluator loop, you can hit 6-8 seconds on a cold start. Provisioned concurrency is worth it for user-facing agentic systems.

Idempotency is not optional. If a Lambda times out mid-turn, you need to be able to replay the invocation without duplicating state. DynamoDB conditional writes and a turn nonce handle this cleanly.

The serverless constraint pushed Wingman toward a cleaner design than the original plan. Reconstructing state from DynamoDB every turn also made debugging straightforward — the state at any point in time is a database query away.
'''

s3 = boto3.client("s3")
key = f"drafts/{SLUG}.md"
s3.put_object(
    Bucket=BUCKET,
    Key=key,
    Body=CONTENT.encode(),
    ContentType="text/markdown",
)
print(f"✓ Seeded s3://{BUCKET}/{key}")
print("Open the admin UI at akashpersetti.com/blog to publish it.")

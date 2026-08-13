#!/usr/bin/env python3
"""
Streaming endpoint verification harness.

Verifies that /chat/stream endpoint streams responses in real-time (not buffered).
Measures first-chunk latency vs. done latency to confirm streaming behavior.

Usage:
    python scripts/verify_streaming.py http://localhost:8000/chat/stream
    python scripts/verify_streaming.py https://api.example.com/chat/stream
"""

import sys
import time
import json
import requests
from typing import Generator, Optional, Tuple

def parse_sse_chunk(chunk: str) -> dict:
    """Parse a single SSE event chunk into a dict. This backend sends bare
    `data: {...}` frames with no `event:` line — the payload IS the event."""
    for line in chunk.split('\n'):
        if line.startswith('data:'):
            data_str = line[5:].strip()
            try:
                return json.loads(data_str)
            except json.JSONDecodeError:
                return {"raw": data_str}
    return None

def stream_chat(url: str, message: str, session_id: str = "test-verify", timeout: int = 30) -> Generator[dict, None, None]:
    """
    Stream chat from endpoint.
    Yields parsed SSE events.
    """
    payload = {
        "session_id": session_id,
        "message": message,
    }

    try:
        response = requests.post(
            url,
            json=payload,
            stream=True,
            timeout=timeout,
            headers={"Accept": "text/event-stream"},
        )
        response.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"Request failed: {e}")

    buffer = ""
    for byte_chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
        if byte_chunk:
            buffer += byte_chunk

            # Split on double newline (SSE event boundary)
            events = buffer.split('\n\n')
            buffer = events.pop() or ""

            for event_str in events:
                if event_str.strip():
                    parsed = parse_sse_chunk(event_str)
                    if parsed:
                        yield parsed

    # Flush remaining buffer
    if buffer.strip():
        parsed = parse_sse_chunk(buffer)
        if parsed:
            yield parsed

def verify_streaming(url: str) -> Tuple[bool, str]:
    """
    Verify streaming endpoint works correctly.

    Returns (success: bool, message: str)
    """
    print(f"Verifying streaming endpoint: {url}")
    print()

    # Test message
    test_message = "Hello, how are you?"
    session_id = f"test-verify-{int(time.time())}"

    try:
        # Measure first chunk and final response latencies
        first_chunk_time: Optional[float] = None
        done_time: Optional[float] = None
        full_response = ""
        event_count = 0
        has_done_event = False

        start_time = time.time()

        for event in stream_chat(url, test_message, session_id):
            if first_chunk_time is None:
                first_chunk_time = time.time() - start_time
                print(f"✓ First chunk received in {first_chunk_time:.2f}s")

            event_count += 1

            if 'chunk' in event:
                full_response += event['chunk']

            if event.get('done'):
                done_time = time.time() - start_time
                has_done_event = True
                print(f"✓ Done event received in {done_time:.2f}s")
                break

        print()
        print(f"Response text ({len(full_response)} chars):")
        print(f"  {full_response[:100]}{'...' if len(full_response) > 100 else ''}")
        print()

        # Verify streaming properties
        checks_passed = 0
        checks_total = 0

        # Check 1: First chunk arrived before done (true streaming)
        checks_total += 1
        if first_chunk_time is not None and done_time is not None:
            streaming_latency = done_time - first_chunk_time
            if streaming_latency > 0.05:  # At least 50ms between first and last
                print(f"✓ [1/4] Streaming latency {streaming_latency:.2f}s (first->done gap indicates real streaming)")
                checks_passed += 1
            else:
                print(f"✗ [1/4] Streaming latency too low {streaming_latency:.3f}s (may be buffered)")

        # Check 2: Got a done event
        checks_total += 1
        if has_done_event:
            print(f"✓ [2/4] Done event received")
            checks_passed += 1
        else:
            print(f"✗ [2/4] No done event")

        # Check 3: Got multiple events (not just one bulk response)
        checks_total += 1
        if event_count >= 2:
            print(f"✓ [3/4] Multiple SSE events ({event_count} total)")
            checks_passed += 1
        else:
            print(f"✗ [3/4] Only {event_count} event(s) — may not be streaming")

        # Check 4: Response has content
        checks_total += 1
        if len(full_response) > 0:
            print(f"✓ [4/4] Response contains {len(full_response)} characters")
            checks_passed += 1
        else:
            print(f"✗ [4/4] No response content")

        print()
        print("=" * 60)
        if checks_passed == checks_total:
            print(f"PASS: {checks_passed}/{checks_total} checks passed")
            print("=" * 60)
            return True, "All checks passed"
        else:
            print(f"FAIL: {checks_passed}/{checks_total} checks passed")
            print("=" * 60)
            return False, f"Only {checks_passed}/{checks_total} checks passed"

    except Exception as e:
        print(f"ERROR: {e}")
        print("=" * 60)
        return False, str(e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_streaming.py <streaming-api-url>")
        print()
        print("Example (local dev):")
        print("  python verify_streaming.py http://localhost:8000/chat/stream")
        print()
        print("Example (production):")
        print("  python verify_streaming.py https://api.example.com/chat/stream")
        sys.exit(1)

    url = sys.argv[1]
    success, message = verify_streaming(url)
    sys.exit(0 if success else 1)

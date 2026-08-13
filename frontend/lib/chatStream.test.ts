import { describe, it, expect } from 'vitest';
import { parseSSEChunk, streamChat } from './chatStream';

describe('parseSSEChunk', () => {
  it('parses single-line SSE event', () => {
    const chunk = 'event: message\ndata: {"chunk":"hello"}';
    const parsed = parseSSEChunk(chunk);
    expect(parsed?.type).toBe('message');
    expect(parsed?.data).toEqual({ chunk: 'hello' });
  });

  it('handles fragmented JSON in data field', () => {
    const chunk = 'event: update\ndata: {"text":"incomplete JSON"}';
    const parsed = parseSSEChunk(chunk);
    expect(parsed?.data.text).toBe('incomplete JSON');
  });

  it('returns null for empty chunk', () => {
    const parsed = parseSSEChunk('');
    expect(parsed).toBeNull();
  });

  it('handles JSON parse errors gracefully', () => {
    const chunk = 'event: error\ndata: not-json-at-all';
    const parsed = parseSSEChunk(chunk);
    expect(parsed?.data).toBe('not-json-at-all');
  });

  it('handles multi-event chunks', () => {
    const chunk1 = 'event: chunk\ndata: {"chunk":"line 1"}';
    const chunk2 = 'event: chunk\ndata: {"chunk":"line 2"}';
    const p1 = parseSSEChunk(chunk1);
    const p2 = parseSSEChunk(chunk2);
    expect(p1?.data.chunk).toBe('line 1');
    expect(p2?.data.chunk).toBe('line 2');
  });
});

describe('streamChat', () => {
  it('handles successful streaming response', async () => {
    // Mock fetch to return a readable stream with SSE events
    const mockResponse = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('event: chunk\ndata: {"chunk":"Hello "}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('event: chunk\ndata: {"chunk":"world"}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('event: done\ndata: {"done":true}\n\n')
        );
        controller.close();
      },
    });

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      body: mockResponse,
      status: 200,
      statusText: 'OK',
    } as any);

    const events = [];
    for await (const event of streamChat('session-1', 'test', 'http://localhost:8000/chat/stream')) {
      events.push(event);
    }

    global.fetch = originalFetch;

    expect(events.length).toBe(3);
    expect(events[0].chunk).toBe('Hello ');
    expect(events[1].chunk).toBe('world');
    expect(events[2].done).toBe(true);
  });

  it('throws on non-200 response', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      body: null,
    } as any);

    let threw = false;
    try {
      for await (const _ of streamChat('session-1', 'test', 'http://localhost:8000/chat/stream')) {
        // noop
      }
    } catch (e) {
      threw = true;
      expect(String(e)).toContain('Streaming request failed: 500');
    }

    global.fetch = originalFetch;
    expect(threw).toBe(true);
  });

  it('throws if no response body', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      body: null,
      status: 200,
      statusText: 'OK',
    } as any);

    let threw = false;
    try {
      for await (const _ of streamChat('session-1', 'test', 'http://localhost:8000/chat/stream')) {
        // noop
      }
    } catch (e) {
      threw = true;
      expect(String(e)).toContain('No response body');
    }

    global.fetch = originalFetch;
    expect(threw).toBe(true);
  });

  it('handles human-controlled outcome', async () => {
    const mockResponse = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('event: human_controlled\ndata: {"human_controlled":true}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('event: done\ndata: {"done":true}\n\n')
        );
        controller.close();
      },
    });

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      body: mockResponse,
      status: 200,
      statusText: 'OK',
    } as any);

    const events = [];
    for await (const event of streamChat('session-1', 'test', 'http://localhost:8000/chat/stream')) {
      events.push(event);
    }

    global.fetch = originalFetch;

    expect(events.some(e => e.human_controlled)).toBe(true);
  });

  it('handles escalation flag', async () => {
    const mockResponse = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('event: chunk\ndata: {"chunk":"Escalating..."}\n\n')
        );
        controller.enqueue(
          new TextEncoder().encode('event: done\ndata: {"done":true,"escalated":true}\n\n')
        );
        controller.close();
      },
    });

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      body: mockResponse,
      status: 200,
      statusText: 'OK',
    } as any);

    const events = [];
    for await (const event of streamChat('session-1', 'test', 'http://localhost:8000/chat/stream')) {
      events.push(event);
    }

    global.fetch = originalFetch;

    const doneEvent = events.find(e => e.done);
    expect(doneEvent?.escalated).toBe(true);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseSSEChunk, streamChat } from './chatStream';

describe('parseSSEChunk', () => {
    it('parses a complete single event', () => {
        const { events, remainder } = parseSSEChunk('data: {"chunk":"hi"}\n\n');
        expect(events).toEqual([{ chunk: 'hi' }]);
        expect(remainder).toBe('');
    });

    it('holds back an incomplete trailing event', () => {
        const { events, remainder } = parseSSEChunk('data: {"chunk":"hi"}\n\ndata: {"chu');
        expect(events).toEqual([{ chunk: 'hi' }]);
        expect(remainder).toBe('data: {"chu');
    });

    it('parses multiple events delivered in one buffer', () => {
        const { events } = parseSSEChunk('data: {"chunk":"a"}\n\ndata: {"chunk":"b"}\n\n');
        expect(events).toEqual([{ chunk: 'a' }, { chunk: 'b' }]);
    });

    it('skips a malformed event without throwing', () => {
        const { events } = parseSSEChunk('data: {not json}\n\ndata: {"chunk":"ok"}\n\n');
        expect(events).toEqual([{ chunk: 'ok' }]);
    });
});

function fakeStreamResponse(chunks: string[], ok = true, status = 200, jsonBody: unknown = {}) {
    const encoder = new TextEncoder();
    let i = 0;
    const body = new ReadableStream<Uint8Array>({
        pull(controller) {
            if (i < chunks.length) {
                controller.enqueue(encoder.encode(chunks[i]));
                i++;
            } else {
                controller.close();
            }
        },
    });
    return { ok, status, body, json: async () => jsonBody } as unknown as Response;
}

describe('streamChat', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('reassembles one SSE event split across many network reads', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeStreamResponse([
            'data: {"chu',
            'nk":"Hello"}\n\nda',
            'ta: {"chunk":" world"}\n\n',
            'data: {"done":true}\n\n',
        ])));

        const events = [];
        for await (const event of streamChat('http://x/chat/stream', { message: 'hi' })) events.push(event);

        expect(events).toEqual([{ chunk: 'Hello' }, { chunk: ' world' }, { done: true }]);
    });

    it('parses multiple SSE events delivered in a single network chunk', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeStreamResponse([
            'data: {"session_id":"s1"}\n\ndata: {"chunk":"hi"}\n\ndata: {"done":true}\n\n',
        ])));

        const events = [];
        for await (const event of streamChat('http://x/chat/stream', {})) events.push(event);

        expect(events).toEqual([{ session_id: 's1' }, { chunk: 'hi' }, { done: true }]);
    });

    it('surfaces human_controlled and error events', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeStreamResponse([
            'data: {"human_controlled":true}\n\ndata: {"done":true}\n\n',
        ])));

        const events = [];
        for await (const event of streamChat('http://x/chat/stream', {})) events.push(event);

        expect(events.some(e => e.human_controlled)).toBe(true);
        expect(events.some(e => e.done)).toBe(true);
    });

    it('throws before streaming on a non-ok HTTP response, using the 429 detail when present', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            fakeStreamResponse([], false, 429, { detail: 'slow down' })
        ));

        await expect(async () => {
            for await (const _ of streamChat('http://x/chat/stream', {})) { /* noop */ }
        }).rejects.toThrow('slow down');
    });

    it('passes the abort signal through to fetch', async () => {
        const fetchMock = vi.fn().mockResolvedValue(fakeStreamResponse(['data: {"done":true}\n\n']));
        vi.stubGlobal('fetch', fetchMock);
        const controller = new AbortController();

        const events = [];
        for await (const event of streamChat('http://x/chat/stream', {}, controller.signal)) events.push(event);

        expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    });
});

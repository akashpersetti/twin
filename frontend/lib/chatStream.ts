export interface ChatStreamEvent {
    session_id?: string;
    chunk?: string;
    human_controlled?: boolean;
    error?: string;
    done?: boolean;
}

export function parseSSEChunk(buffer: string): { events: ChatStreamEvent[]; remainder: string } {
    const events: ChatStreamEvent[] = [];
    const frames = buffer.split('\n\n');
    const remainder = frames.pop() ?? '';

    for (const frame of frames) {
        const dataLine = frame.split('\n').find(line => line.startsWith('data: '));
        if (!dataLine) continue;
        const payload = dataLine.slice('data: '.length);
        try {
            events.push(JSON.parse(payload) as ChatStreamEvent);
        } catch {
            // Malformed event — drop it rather than crashing the stream.
        }
    }

    return { events, remainder };
}

export async function* streamChat(
    url: string,
    body: unknown,
    signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
            response.status === 429 && errorBody?.detail ? errorBody.detail : 'Request failed'
        );
    }
    if (!response.body) {
        throw new Error('Streaming not supported: response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const { events, remainder } = parseSSEChunk(buffer);
            buffer = remainder;
            for (const event of events) yield event;
        }
    } finally {
        reader.releaseLock();
    }
}

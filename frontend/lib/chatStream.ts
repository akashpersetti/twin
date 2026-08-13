/**
 * SSE (Server-Sent Events) parser and streaming utility for Twin's /chat/stream endpoint.
 * Uses native fetch + ReadableStream, no DOM dependencies.
 */

/**
 * Parse a single SSE event string into an object with data, event type, etc.
 * SSE format: "event: <type>\ndata: <json>\n\n"
 */
export function parseSSEChunk(chunk: string): Record<string, any> | null {
  const lines = chunk.split('\n');
  const event: Record<string, any> = {};

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event.type = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      const dataStr = line.substring(5).trim();
      try {
        event.data = JSON.parse(dataStr);
      } catch {
        event.data = dataStr;
      }
    }
  }

  return Object.keys(event).length > 0 ? event : null;
}

/**
 * Stream chat responses from Twin's /chat/stream endpoint.
 * Yields text chunks and metadata events (done, escalated, etc.).
 *
 * Usage:
 *   const stream = streamChat(sessionId, message, apiUrl);
 *   for await (const event of stream) {
 *     if (event.chunk) console.log(event.chunk); // text chunk
 *     if (event.done) break; // response complete
 *   }
 */
export async function* streamChat(
  sessionId: string,
  message: string,
  apiUrl: string
): AsyncGenerator<Record<string, any>, void, unknown> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Streaming request failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body for streaming request');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newline (SSE event boundary)
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete event in buffer

      for (const eventStr of events) {
        if (eventStr.trim()) {
          const parsed = parseSSEChunk(eventStr);
          if (parsed) {
            // Flatten data fields into event for easier consumption
            const event = { ...parsed.data, type: parsed.type };
            yield event;
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const parsed = parseSSEChunk(buffer);
      if (parsed) {
        const event = { ...parsed.data, type: parsed.type };
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

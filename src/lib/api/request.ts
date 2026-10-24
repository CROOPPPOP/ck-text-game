export type JsonBodyResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: Response };

export async function readJsonBody<T = unknown>(request: Request, maxBytes: number): Promise<JsonBodyResult<T>> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { ok: false, response: Response.json({ error: 'Content-Type must be application/json.' }, { status: 415 }) };
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, response: Response.json({ error: 'Request body is too large.' }, { status: 413 }) };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    const reader = request.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          try { await reader.cancel(); } catch { /* Request already closed. */ }
          return { ok: false, response: Response.json({ error: 'Request body is too large.' }, { status: 413 }) };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { ok: false, response: Response.json({ error: 'Unable to read request body.' }, { status: 400 }) };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let raw: string;
  try {
    raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, response: Response.json({ error: 'Request body must be UTF-8 JSON.' }, { status: 400 }) };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as T };
  } catch {
    return { ok: false, response: Response.json({ error: 'Request body must contain valid JSON.' }, { status: 400 }) };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidOptionalApiKey(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= 512);
}


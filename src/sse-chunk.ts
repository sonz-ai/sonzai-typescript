/**
 * SSE chunk envelope used when a payload exceeds the maximum frame size.
 *
 * Each chunk carries a partial JSON string in `data` alongside an `index`
 * (0-based) and the `total` number of chunks. The consumer concatenates
 * all `data` strings in order and JSON.parses the result once all chunks
 * have arrived.
 */
export interface SSEChunkEnvelope {
  __chunk: { index: number; total: number };
  data: string;
}

/** Default maximum size (in bytes) of a single SSE data frame. */
export const DEFAULT_MAX_CHUNK_SIZE = 256 * 1024; // 256 KB

/**
 * Returns true if `obj` looks like an {@link SSEChunkEnvelope}.
 *
 * The check is deliberately loose — it only asserts the presence of `__chunk`
 * with numeric `index` and `total` fields — so that unknown extra fields on
 * the envelope are silently ignored (forward compatibility).
 */
export function isChunkEnvelope(obj: unknown): obj is SSEChunkEnvelope {
  if (typeof obj !== "object" || obj === null) return false;
  const rec = obj as Record<string, unknown>;
  if (typeof rec.__chunk !== "object" || rec.__chunk === null) return false;
  const chunk = rec.__chunk as Record<string, unknown>;
  return typeof chunk.index === "number" && typeof chunk.total === "number";
}

/**
 * Splits a payload into one or more SSE-formatted strings (`"data: ...\n\n"`).
 *
 * If the serialized JSON fits within `maxChunkSize` bytes, a single
 * un-enveloped frame is returned (backward compatible with consumers that
 * do not understand chunking).
 *
 * Otherwise the JSON string is split into `ceil(len / maxChunkSize)` pieces,
 * each wrapped in an {@link SSEChunkEnvelope}.
 *
 * @param payload    - The object to serialize and (potentially) chunk.
 * @param maxChunkSize - Maximum byte length per chunk data string.
 *                       Defaults to {@link DEFAULT_MAX_CHUNK_SIZE}.
 * @returns An array of SSE-formatted strings ready to be written to the wire.
 */
export function chunkPayload(
  payload: Record<string, unknown>,
  maxChunkSize: number = DEFAULT_MAX_CHUNK_SIZE,
): string[] {
  const json = JSON.stringify(payload);
  const byteLen = new TextEncoder().encode(json).byteLength;

  if (byteLen <= maxChunkSize) {
    return [`data: ${json}\n\n`];
  }

  // Split by *character* count that approximates the byte budget. For pure
  // ASCII this is exact; for multi-byte characters we may produce slightly
  // smaller chunks than the limit, which is safe.
  const totalChunks = Math.ceil(byteLen / maxChunkSize);
  const charsPerChunk = Math.ceil(json.length / totalChunks);

  const frames: string[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * charsPerChunk;
    const slice = json.slice(start, start + charsPerChunk);
    const envelope: SSEChunkEnvelope = {
      __chunk: { index: i, total: totalChunks },
      data: slice,
    };
    frames.push(`data: ${JSON.stringify(envelope)}\n\n`);
  }

  return frames;
}

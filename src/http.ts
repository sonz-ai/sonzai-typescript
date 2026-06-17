import {
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  SonzaiError,
} from "./errors.js";

export interface HTTPClientOptions {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  defaultHeaders?: Record<string, string>;
  customFetch?: typeof fetch;
}

export class HTTPClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: HTTPClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "sonzai-typescript/1.7.1",
      ...options.defaultHeaders,
    };
    this.timeout = options.timeout;
    this.maxRetries = options.maxRetries;
    this.fetchFn = options.customFetch ?? fetch;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options?: {
      body?: Record<string, unknown>;
      params?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      /**
       * Override the per-request timeout, in milliseconds. Used by
       * detached call variants which manage their own (longer)
       * deadline. Falls back to the client-level timeout.
       */
      timeoutMs?: number;
      /**
       * Override the AbortSignal used for the underlying fetch. Used
       * by detached call variants to drive cancellation from a
       * decoupled controller. When supplied, the per-request timeout
       * is expected to be encoded in this signal already (e.g. via
       * `AbortSignal.any([controller.signal, AbortSignal.timeout(...)])`).
       */
      signal?: AbortSignal;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const isIdempotent = method === "GET" || method === "DELETE";
    const maxAttempts = isIdempotent ? this.maxRetries + 1 : 1;
    const mergedHeaders = options?.headers
      ? { ...this.headers, ...options.headers }
      : this.headers;
    const useExternalSignal = options?.signal !== undefined;
    const effectiveTimeout = options?.timeoutMs ?? this.timeout;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // When the caller supplies its own signal (detached variants), we
      // trust it to encode the timeout and skip the per-attempt timer.
      const controller = useExternalSignal ? null : new AbortController();
      const timer = controller
        ? setTimeout(() => controller.abort(), effectiveTimeout)
        : null;
      const signal = options?.signal ?? controller?.signal;

      try {
        const response = await this.fetchFn(url, {
          method,
          headers: mergedHeaders,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal,
        });

        // Retry on 5xx for idempotent methods
        if (
          response.status >= 500 &&
          isIdempotent &&
          attempt < maxAttempts - 1
        ) {
          if (timer) clearTimeout(timer);
          await this.backoff(attempt);
          continue;
        }

        await this.throwOnError(response);

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          return (await response.json()) as T;
        }
        return (await response.text()) as T;
      } catch (error) {
        if (timer) clearTimeout(timer);
        // Retry on network errors for idempotent methods
        if (
          isIdempotent &&
          attempt < maxAttempts - 1 &&
          this.isNetworkError(error)
        ) {
          await this.backoff(attempt);
          continue;
        }
        throw error;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    // Unreachable, but satisfies TypeScript
    throw new InternalServerError("Max retries exceeded");
  }

  private async backoff(attempt: number): Promise<void> {
    // Exponential backoff: 100ms * 2^attempt, capped at 5s, plus jitter
    const base = Math.min(100 * 2 ** attempt, 5000);
    const jitter = Math.random() * base;
    await new Promise((resolve) => setTimeout(resolve, base + jitter));
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof SonzaiError) return false;
    return (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError")
    );
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>("POST", path, { body, params, headers });
  }

  async put<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>("PUT", path, { body, headers });
  }

  async patch<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>("PATCH", path, { body, headers });
  }

  async delete<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("DELETE", path, { params });
  }

  async uploadFile<T = unknown>(
    path: string,
    fileName: string,
    fileData: Blob | Buffer | ArrayBuffer,
    contentType: string,
    options?: { signal?: AbortSignal; timeoutMs?: number },
  ): Promise<T> {
    const url = this.buildUrl(path);
    const formData = new FormData();
    let blob: Blob;
    if (fileData instanceof Blob) {
      blob = fileData;
    } else {
      const data =
        fileData instanceof ArrayBuffer
          ? fileData
          : new Uint8Array(fileData).buffer;
      blob = new Blob([data], { type: contentType });
    }
    formData.append("file", blob, fileName);

    // Uploads can legitimately take longer than a JSON round-trip, so default
    // to 10× the base timeout. A hung connection with no timeout was previously
    // able to block the caller indefinitely.
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? this.timeout * 10;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    if (options?.signal) {
      // Attach the listener first, then check .aborted — reversing the
      // order opens a race window where the signal can fire between the
      // check and the addEventListener call, and a listener added after
      // the event already fired does not receive it.
      options.signal.addEventListener("abort", onExternalAbort, { once: true });
      if (options.signal.aborted) controller.abort();
    }

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: this.headers["Authorization"],
          "User-Agent": this.headers["User-Agent"],
        },
        body: formData,
        signal: controller.signal,
      });

      await this.throwOnError(response);

      const contentTypeResp = response.headers.get("content-type") ?? "";
      if (contentTypeResp.includes("application/json")) {
        return (await response.json()) as T;
      }
      return (await response.text()) as T;
    } finally {
      clearTimeout(timer);
      options?.signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  async *streamSSE(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    options?: {
      /**
       * Externally-managed AbortSignal. When supplied, this signal
       * drives cancellation of the underlying fetch (and the SDK does
       * NOT also wire up its own timeout — the caller is expected to
       * encode any deadline in the supplied signal, e.g. via
       * `AbortSignal.any([controller.signal, AbortSignal.timeout(...)])`).
       *
       * Used by the detached chat variants on {@link Agents} to keep
       * the stream alive independently of the caller's request
       * lifecycle.
       */
      signal?: AbortSignal;
    },
  ): AsyncGenerator<Record<string, unknown>> {
    const url = this.buildUrl(path);

    const useExternalSignal = options?.signal !== undefined;
    // When the caller supplies its own signal, skip the SDK's
    // streaming-timeout fallback — the caller's signal is expected to
    // encode the deadline.
    const controller = useExternalSignal ? null : new AbortController();
    const timer = controller
      ? setTimeout(() => controller.abort(), this.timeout * 10)
      : null;
    const signal = options?.signal ?? controller?.signal;

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          ...this.headers,
          Accept: "text/event-stream",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      await this.throwOnError(response);

      if (!response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      // The string buffer grows unbounded until a "\n" delimiter is found.
      // Unlike Go's bufio.Scanner (64 KB hard limit), JavaScript strings have no
      // fixed token size cap, so large SSE events such as context_ready (which
      // embeds the full enriched context JSON in a single data: line and can
      // exceed 64 KB) are handled correctly without any explicit buffer configuration.
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") return;
            if (trimmed.startsWith("data: ")) {
              try {
                yield JSON.parse(trimmed.slice(6));
              } catch (e) {
                console.warn(
                  "[sonzai-sdk] Malformed SSE JSON event skipped:",
                  trimmed.slice(6),
                  e,
                );
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed === "data: [DONE]") return;
          if (trimmed.startsWith("data: ")) {
            try {
              yield JSON.parse(trimmed.slice(6));
            } catch (e) {
              console.warn(
                "[sonzai-sdk] Malformed SSE JSON event skipped:",
                trimmed.slice(6),
                e,
              );
            }
          }
        }
      } finally {
        // releaseLock() detaches the reader without awaiting stream cleanup.
        // reader.cancel() can hang indefinitely when we exit early (e.g. after
        // "data: [DONE]") before the underlying stream signals done=true —
        // network-level teardown is handled by the AbortController below.
        reader.releaseLock();
      }
    } finally {
      if (timer) clearTimeout(timer);
      // Only abort the SDK-owned controller; if the caller supplied an
      // external signal we leave teardown to them (the underlying fetch
      // is already done by the time we exit the generator).
      controller?.abort();
    }
  }

  /**
   * Stream a named-event SSE response (`event: <name>` + `data: <json>`
   * frame pairs) and yield `{event, data}` for each dispatched frame.
   *
   * Unlike {@link streamSSE} (which is tailored to the chat wire format
   * and ignores `event:` lines), this parser tracks the SSE event name
   * so callers can distinguish e.g. `update` vs `result` vs `error`
   * frames. Frames without an explicit `event:` line are reported under
   * the SSE default name `"message"`. A `data: [DONE]` sentinel ends
   * the stream.
   */
  async *streamNamedSSE(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    options?: {
      /** Query-string parameters appended to the URL. */
      params?: Record<string, string | number | boolean | undefined>;
      /**
       * Externally-managed AbortSignal. When supplied, the SDK does not
       * wire up its own timeout — the caller is expected to encode any
       * deadline in the supplied signal.
       */
      signal?: AbortSignal;
      /**
       * Overall stream deadline in milliseconds when no external signal
       * is supplied. Defaults to 10× the client timeout. Long-running
       * callers (built-in agent invocations) pass a larger value.
       */
      timeoutMs?: number;
    },
  ): AsyncGenerator<{ event: string; data: Record<string, unknown> }> {
    const url = this.buildUrl(path, options?.params);

    const useExternalSignal = options?.signal !== undefined;
    const controller = useExternalSignal ? null : new AbortController();
    const timer = controller
      ? setTimeout(
          () => controller.abort(),
          options?.timeoutMs ?? this.timeout * 10,
        )
      : null;
    const signal = options?.signal ?? controller?.signal;

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          ...this.headers,
          Accept: "text/event-stream",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      await this.throwOnError(response);

      if (!response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventName = "message";
      let dataLines: string[] = [];
      let done = false;

      // Dispatch the accumulated frame (blank-line boundary reached).
      const flush = (): {
        event: string;
        data: Record<string, unknown>;
      } | null => {
        const name = eventName;
        eventName = "message";
        if (dataLines.length === 0) return null;
        const payload = dataLines.join("\n");
        dataLines = [];
        if (payload === "[DONE]") {
          done = true;
          return null;
        }
        try {
          return {
            event: name,
            data: JSON.parse(payload) as Record<string, unknown>,
          };
        } catch (e) {
          console.warn(
            "[sonzai-sdk] Malformed SSE JSON event skipped:",
            payload,
            e,
          );
          return null;
        }
      };

      const handleLine = (
        rawLine: string,
      ): { event: string; data: Record<string, unknown> } | null => {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (line === "") return flush();
        if (line.startsWith(":")) return null; // SSE comment / keepalive
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
          return null;
        }
        if (line.startsWith("data:")) {
          let value = line.slice(5);
          if (value.startsWith(" ")) value = value.slice(1);
          dataLines.push(value);
          return null;
        }
        return null;
      };

      try {
        while (true) {
          const { done: readDone, value } = await reader.read();
          if (readDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const frame = handleLine(line);
            if (frame) yield frame;
            if (done) return;
          }
        }

        // Process any remaining buffered line, then flush the final frame
        // (streams that end without a trailing blank line).
        if (buffer !== "") {
          const frame = handleLine(buffer);
          if (frame) yield frame;
          if (done) return;
        }
        const tail = flush();
        if (tail) yield tail;
      } finally {
        // releaseLock() detaches the reader without awaiting stream cleanup
        // (see streamSSE above for why reader.cancel() is avoided).
        reader.releaseLock();
      }
    } finally {
      if (timer) clearTimeout(timer);
      controller?.abort();
    }
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async throwOnError(response: Response): Promise<void> {
    if (response.ok) return;

    let message: string;
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? response.statusText;
    } catch {
      try {
        message = await response.text();
      } catch {
        message = response.statusText;
      }
    }

    const status = response.status;
    switch (status) {
      case 401:
        throw new AuthenticationError(message);
      case 403:
        throw new PermissionDeniedError(message);
      case 404:
        throw new NotFoundError(message);
      case 400:
        throw new BadRequestError(message);
      case 429: {
        const retryAfterRaw = response.headers.get("Retry-After");
        const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
        throw new RateLimitError(
          message,
          retryAfter && !Number.isNaN(retryAfter) ? retryAfter : undefined,
        );
      }
      default:
        if (status >= 500) throw new InternalServerError(message);
        throw new APIError(status, message);
    }
  }
}

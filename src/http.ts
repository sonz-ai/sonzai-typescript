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
}

export class HTTPClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(options: HTTPClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "sonzai-typescript/1.0.3",
    };
    this.timeout = options.timeout;
    this.maxRetries = options.maxRetries;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options?: {
      body?: Record<string, unknown>;
      params?: Record<string, string | number | boolean | undefined>;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const isIdempotent = method === "GET" || method === "DELETE";
    const maxAttempts = isIdempotent ? this.maxRetries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: this.headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        // Retry on 5xx for idempotent methods
        if (response.status >= 500 && isIdempotent && attempt < maxAttempts - 1) {
          clearTimeout(timer);
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
        clearTimeout(timer);
        // Retry on network errors for idempotent methods
        if (isIdempotent && attempt < maxAttempts - 1 && this.isNetworkError(error)) {
          await this.backoff(attempt);
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }

    // Unreachable, but satisfies TypeScript
    throw new InternalServerError("Max retries exceeded");
  }

  private async backoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * 2 ** attempt, 10000) + Math.random() * 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
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
  ): Promise<T> {
    return this.request<T>("POST", path, { body, params });
  }

  async put<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  async patch<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  async delete<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>("DELETE", path, { params });
  }

  async *streamSSE(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): AsyncGenerator<Record<string, unknown>> {
    const url = this.buildUrl(path);

    const controller = new AbortController();
    // Longer timeout for streaming
    const timer = setTimeout(() => controller.abort(), this.timeout * 10);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.headers,
          Accept: "text/event-stream",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      await this.throwOnError(response);

      if (!response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
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
        await reader.cancel();
      }
    } finally {
      clearTimeout(timer);
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

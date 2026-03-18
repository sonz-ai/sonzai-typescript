import {
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
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

  constructor(options: HTTPClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "sonzai-typescript/1.13.0",
    };
    this.timeout = options.timeout;
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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      await this.throwOnError(response);

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }
      return (await response.text()) as T;
    } finally {
      clearTimeout(timer);
    }
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
            } catch {
              // Skip malformed JSON
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
          } catch {
            // Skip malformed JSON
          }
        }
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
      case 429:
        throw new RateLimitError(message);
      default:
        if (status >= 500) throw new InternalServerError(message);
        throw new APIError(status, message);
    }
  }
}

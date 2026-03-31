import { HTTPClient } from "./http.js";
import { Agents } from "./resources/agents.js";
import { EvalRuns } from "./resources/eval-runs.js";
import { EvalTemplates } from "./resources/eval-templates.js";
import { Knowledge } from "./resources/knowledge.js";
import { Voices } from "./resources/voice.js";
import { Webhooks } from "./resources/webhooks.js";
import type { SonzaiConfig } from "./types.js";

const DEFAULT_BASE_URL = "https://api.sonz.ai";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Resolve the API key from config or environment variables.
 * Works with Node.js, Bun, and Deno.
 */
function resolveApiKey(config?: SonzaiConfig): string {
  if (config?.apiKey) return config.apiKey;

  // Node.js / Bun
  if (typeof process !== "undefined" && process.env) {
    const key = process.env.SONZAI_API_KEY;
    if (key) return key;
  }

  // Deno
  if (typeof Deno !== "undefined") {
    try {
      const key = Deno.env.get("SONZAI_API_KEY");
      if (key) return key;
    } catch {
      // Permission denied
    }
  }

  throw new Error(
    "apiKey must be provided or set via the SONZAI_API_KEY environment variable",
  );
}

function resolveBaseUrl(config?: SonzaiConfig): string {
  if (config?.baseUrl) return config.baseUrl;

  if (typeof process !== "undefined" && process.env) {
    const url = process.env.SONZAI_BASE_URL;
    if (url) return url;
  }

  if (typeof Deno !== "undefined") {
    try {
      const url = Deno.env.get("SONZAI_BASE_URL");
      if (url) return url;
    } catch {
      // Permission denied
    }
  }

  return DEFAULT_BASE_URL;
}

// Deno type shim for TypeScript compilation
declare const Deno: {
  env: { get(key: string): string | undefined };
} | undefined;

/**
 * Sonzai Mind Layer API client.
 *
 * Works with Node.js (>=18), Bun, and Deno. Uses the native `fetch` API
 * with zero runtime dependencies.
 *
 * @example
 * ```ts
 * import { Sonzai } from "sonzai";
 *
 * const client = new Sonzai({ apiKey: "your-api-key" });
 *
 * // Chat with an agent
 * const response = await client.agents.chat({
 *   agent: "agent-id",
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 * console.log(response.content);
 *
 * // Stream chat
 * for await (const event of client.agents.chatStream({
 *   agent: "agent-id",
 *   messages: [{ role: "user", content: "Tell me a story" }],
 * })) {
 *   process.stdout.write(event.choices?.[0]?.delta?.content ?? "");
 * }
 * ```
 */
export class Sonzai {
  readonly agents: Agents;
  /** Project-scoped knowledge base (documents, graph, schemas, search, analytics). */
  readonly knowledge: Knowledge;
  readonly evalTemplates: EvalTemplates;
  readonly evalRuns: EvalRuns;
  readonly voices: Voices;
  readonly webhooks: Webhooks;

  private readonly http: HTTPClient;

  constructor(config?: SonzaiConfig) {
    const apiKey = resolveApiKey(config);
    const baseUrl = resolveBaseUrl(config);

    this.http = new HTTPClient({
      baseUrl,
      apiKey,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
    });

    this.agents = new Agents(this.http);
    this.knowledge = new Knowledge(this.http);
    this.evalTemplates = new EvalTemplates(this.http);
    this.evalRuns = new EvalRuns(this.http);
    this.voices = new Voices(this.http);
    this.webhooks = new Webhooks(this.http);
  }
}

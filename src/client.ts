import { HTTPClient } from "./http.js";
import { Agents } from "./resources/agents.js";
import { Analytics } from "./resources/analytics.js";
import { Composio } from "./resources/composio.js";
import { CustomLLM } from "./resources/custom-llm.js";
import { EvalRuns } from "./resources/eval-runs.js";
import { EvalTemplates } from "./resources/eval-templates.js";
import { Knowledge } from "./resources/knowledge.js";
import { AccountConfig } from "./resources/account-config.js";
import { ProjectConfig } from "./resources/project-config.js";
import { ProjectNotifications } from "./resources/project-notifications.js";
import { Projects } from "./resources/projects.js";
import { Skills } from "./resources/skills.js";
import { UserPersonas } from "./resources/user-personas.js";
import { Voices } from "./resources/voice.js";
import { Webhooks } from "./resources/webhooks.js";
import { Wisdom } from "./resources/wisdom.js";
import { Workbench } from "./resources/workbench.js";
import type { PlatformModelsResponse, SonzaiConfig } from "./types.js";

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
declare const Deno:
  | {
      env: { get(key: string): string | undefined };
    }
  | undefined;

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
  /** Usage, cost, and real-time analytics for the current project. */
  readonly analytics: Analytics;
  /** Project-scoped knowledge base (documents, graph, schemas, search, analytics). */
  readonly knowledge: Knowledge;
  readonly evalTemplates: EvalTemplates;
  readonly evalRuns: EvalRuns;
  readonly voices: Voices;
  readonly webhooks: Webhooks;
  /** Project-scoped configuration (key-value store). */
  readonly projectConfig: ProjectConfig;
  /** Tenant-scoped ("account-level") configuration. Applies to every project in the tenant. */
  readonly accountConfig: AccountConfig;
  /** Project-scoped custom LLM provider configuration. */
  readonly customLLM: CustomLLM;
  /** Project-scoped notification polling for backends. */
  readonly projectNotifications: ProjectNotifications;
  /** Project management (create, update, delete projects and API keys). */
  readonly projects: Projects;
  /** User persona management (create, update, delete user personas). */
  readonly userPersonas: UserPersonas;
  /**
   * Composio per-agent connected SaaS accounts (Gmail, Calendar, Slack,
   * GitHub, Linear, Notion, Drive). Connections + audit + available
   * actions. Gated on the `Composio` agent capability server-side.
   */
  readonly composio: Composio;
  /**
   * Project-scoped skill library + per-agent enablement. Skills are
   * markdown playbooks the agent loads on demand via sonzai_load_skill.
   */
  readonly skills: Skills;
  /**
   * Attributed wisdom — person/entity-attributed facts, attributed
   * relations, disclosure audit, and bulk import. Gated on the
   * WisdomPublicSharing agent capability.
   */
  readonly wisdom: Wisdom;
  /** Workbench (time-machine / harness) operations for benchmarks and dev workflows. */
  readonly workbench: Workbench;

  private readonly http: HTTPClient;

  constructor(config?: SonzaiConfig) {
    const apiKey = resolveApiKey(config);
    const baseUrl = resolveBaseUrl(config);

    this.http = new HTTPClient({
      baseUrl,
      apiKey,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
      defaultHeaders: config?.defaultHeaders,
      customFetch: config?.customFetch,
    });

    this.agents = new Agents(this.http);
    this.analytics = new Analytics(this.http);
    this.knowledge = new Knowledge(this.http);
    this.evalTemplates = new EvalTemplates(this.http);
    this.evalRuns = new EvalRuns(this.http);
    this.voices = new Voices(this.http);
    this.webhooks = new Webhooks(this.http);
    this.projectConfig = new ProjectConfig(this.http);
    this.accountConfig = new AccountConfig(this.http);
    this.customLLM = new CustomLLM(this.http);
    this.projectNotifications = new ProjectNotifications(this.http);
    this.projects = new Projects(this.http);
    this.userPersonas = new UserPersonas(this.http);
    this.composio = new Composio(this.http);
    this.skills = new Skills(this.http);
    this.wisdom = new Wisdom(this.http);
    this.workbench = new Workbench(this.http);
  }

  /**
   * List all LLM providers and model variants enabled on this deployment.
   *
   * This is a platform-level call — it does not require an agent ID. Use it
   * to populate model picker UIs or validate model IDs before a chat request.
   *
   * @example
   * ```ts
   * const { providers, default_model } = await client.listModels();
   * for (const p of providers) {
   *   console.log(p.provider_name, p.models.map(m => m.id));
   * }
   * ```
   */
  listModels(): Promise<PlatformModelsResponse> {
    return this.http.get<PlatformModelsResponse>("/api/v1/models");
  }
}

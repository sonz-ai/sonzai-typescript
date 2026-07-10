import { HTTPClient } from "./http.js";
import { Agents } from "./resources/agents.js";
import { Analytics } from "./resources/analytics.js";
import { BuiltinAgents } from "./resources/builtin-agents.js";
import { ChannelConnections } from "./resources/channel-connections.js";
import { Channels } from "./resources/channels.js";
import { Conversations } from "./resources/conversations.js";
import { BYOK } from "./resources/byok.js";
import { Composio } from "./resources/composio.js";
import { Crm } from "./resources/crm.js";
import { CustomAgents } from "./resources/custom-agents.js";
import { CustomLLM } from "./resources/custom-llm.js";
import { Pipelines } from "./resources/pipelines.js";
import { EvalRuns } from "./resources/eval-runs.js";
import { EvalTemplates } from "./resources/eval-templates.js";
import { Ingest } from "./resources/ingest.js";
import { Knowledge } from "./resources/knowledge.js";
import { LeadAssignments } from "./resources/lead-assignments.js";
import { MCPCatalog } from "./resources/mcp-catalog.js";
import { Ml } from "./resources/ml.js";
import { AccountConfig } from "./resources/account-config.js";
import { Org } from "./resources/org.js";
import { ProjectConfig } from "./resources/project-config.js";
import { ProjectNotifications } from "./resources/project-notifications.js";
import { Projects } from "./resources/projects.js";
import { Schedules } from "./resources/schedules.js";
import { Skills } from "./resources/skills.js";
import { Storefront } from "./resources/storefront.js";
import { Support } from "./resources/support.js";
import { Tenants } from "./resources/tenants.js";
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

function resolveRuntimeBaseUrl(config?: SonzaiConfig): string | undefined {
  if (config?.runtimeBaseUrl) return config.runtimeBaseUrl;

  if (typeof process !== "undefined" && process.env) {
    const url = process.env.SONZAI_RUNTIME_BASE_URL;
    if (url) return url;
  }

  if (typeof Deno !== "undefined") {
    try {
      const url = Deno.env.get("SONZAI_RUNTIME_BASE_URL");
      if (url) return url;
    } catch {
      // Permission denied
    }
  }

  return undefined;
}

function resolveRuntimeApiKey(config?: SonzaiConfig): string | undefined {
  if (config?.runtimeApiKey) return config.runtimeApiKey;

  if (typeof process !== "undefined" && process.env) {
    const key = process.env.SONZAI_RUNTIME_API_KEY;
    if (key) return key;
  }

  if (typeof Deno !== "undefined") {
    try {
      const key = Deno.env.get("SONZAI_RUNTIME_API_KEY");
      if (key) return key;
    } catch {
      // Permission denied
    }
  }

  return undefined;
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
  /**
   * Sonzai Built-in Agents — platform-hosted vertical task agents
   * (lead research, market intel, lead extraction / scoring /
   * qualification) invoked by slug. Runs are billed per token plus
   * runtime at the tenant's billing mode.
   */
  readonly builtinAgents: BuiltinAgents;
  /**
   * Sonzai ML — the platform's generalized, multi-tenant / multi-vertical ML &
   * RL primitives keyed by a free-form `useCase` string: supervised scoring
   * (train + calibrated predict), contextual-bandit next-best-action (decide +
   * learn), off-policy evaluation, an end-to-end learning simulation, and a
   * single unified feedback call.
   */
  readonly ml: Ml;
  /**
   * Lead Assignments — the tenant-generic work-distribution primitive:
   * offer/claim/release/complete a unit of work to a rep from a candidate
   * roster, with structural dedup and SLA re-offer.
   */
  readonly leadAssignments: LeadAssignments;
  /**
   * Adapter ingestion — customer-owned adapters POST normalized
   * DomainEvents/contacts here so the platform's pipelines, lead-assignment
   * ledger, and outbound webhooks can react.
   */
  readonly ingest: Ingest;
  /** Usage, cost, and real-time analytics for the current project. */
  readonly analytics: Analytics;
  /** Project-scoped knowledge base (documents, graph, schemas, search, analytics). */
  readonly knowledge: Knowledge;
  readonly evalTemplates: EvalTemplates;
  readonly evalRuns: EvalRuns;
  readonly voices: Voices;
  readonly webhooks: Webhooks;
  /** Notification channels — webhook / email / composio delivery targets for platform events. */
  readonly channels: Channels;
  /** Omnichannel conversations — inbox, messages, handoff, read state, and SSE events. */
  readonly conversations: Conversations;
  /**
   * Runtime-local CRM adapter surface. Served by app-runtime under
   * `/api/rt/crm/*`; configure `runtimeBaseUrl` and authenticate with the
   * runtime adapter token.
   */
  readonly crm: Crm;
  /** Project-scoped Meta channel connections (WhatsApp / Messenger / Instagram). */
  readonly channelConnections: ChannelConnections;
  /** Project-scoped configuration (key-value store). */
  readonly projectConfig: ProjectConfig;
  /** Tenant-scoped ("account-level") configuration. Applies to every project in the tenant. */
  readonly accountConfig: AccountConfig;
  /** Project-scoped custom LLM provider configuration. */
  readonly customLLM: CustomLLM;
  /** Project-scoped BYOK (bring-your-own-key) provider configuration. */
  readonly byok: BYOK;
  /** Project-scoped notification polling for backends. */
  readonly projectNotifications: ProjectNotifications;
  /** Project management (create, update, delete projects and API keys). */
  readonly projects: Projects;
  /** User persona management (create, update, delete user personas). */
  readonly userPersonas: UserPersonas;
  /**
   * Recurring per-user schedules. Top-level alias of `client.agents.schedules`
   * — both reference the same resource for parity with the Python SDK.
   */
  readonly schedules: Schedules;
  /**
   * Organization-level billing, contracts, ledgers, vouchers, and pricing.
   * Most app developers don't need this; admin/billing UIs do.
   */
  readonly org: Org;
  /** Storefront — agent marketplace publishing for the current tenant. */
  readonly storefront: Storefront;
  /**
   * MCP catalog — per-project registry of MCP servers. Each entry pairs
   * a remote MCP URL with auth config; agents opt into specific entries
   * via the `mcpEnabled` capability. Org-admin only on writes.
   */
  readonly mcpCatalog: MCPCatalog;
  /** Support tickets — create, comment on, and close support tickets. */
  readonly support: Support;
  /**
   * Tenants — multi-tenant lookup and tenant-scoped organization
   * knowledge graph access. Primarily for admin tools.
   */
  readonly tenants: Tenants;
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
  /** Project-scoped custom agent definitions (create, update, delete custom agents). */
  readonly customAgents: CustomAgents;
  /**
   * Project-scoped pipelines — chain multiple agent steps into a single
   * run. Manage definitions, append steps, and execute end-to-end.
   */
  readonly pipelines: Pipelines;

  private readonly http: HTTPClient;

  constructor(config?: SonzaiConfig) {
    const apiKey = resolveApiKey(config);
    const baseUrl = resolveBaseUrl(config);
    const runtimeBaseUrl = resolveRuntimeBaseUrl(config);
    const runtimeApiKey = resolveRuntimeApiKey(config);

    this.http = new HTTPClient({
      baseUrl,
      apiKey,
      timeout: config?.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
      defaultHeaders: config?.defaultHeaders,
      customFetch: config?.customFetch,
    });
    const runtimeHeaders = {
      ...config?.defaultHeaders,
      ...(config?.runtimeTenantId
        ? { "X-Sonzai-Tenant-ID": config.runtimeTenantId }
        : {}),
    };
    const runtimeHttp = runtimeBaseUrl && runtimeApiKey
      ? new HTTPClient({
          baseUrl: runtimeBaseUrl,
          apiKey: runtimeApiKey,
          timeout: config?.timeout ?? DEFAULT_TIMEOUT,
          maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
          defaultHeaders: runtimeHeaders,
          customFetch: config?.customFetch,
        })
      : undefined;

    this.agents = new Agents(this.http);
    this.builtinAgents = new BuiltinAgents(this.http);
    this.ml = new Ml(this.http);
    this.leadAssignments = new LeadAssignments(this.http);
    this.ingest = new Ingest(this.http);
    this.analytics = new Analytics(this.http);
    this.knowledge = new Knowledge(this.http);
    this.evalTemplates = new EvalTemplates(this.http);
    this.evalRuns = new EvalRuns(this.http);
    this.voices = new Voices(this.http);
    this.webhooks = new Webhooks(this.http);
    this.channels = new Channels(this.http);
    this.conversations = new Conversations(this.http);
    this.crm = new Crm(runtimeHttp);
    this.channelConnections = new ChannelConnections(this.http);
    this.projectConfig = new ProjectConfig(this.http);
    this.accountConfig = new AccountConfig(this.http);
    this.customLLM = new CustomLLM(this.http);
    this.byok = new BYOK(this.http);
    this.projectNotifications = new ProjectNotifications(this.http);
    this.projects = new Projects(this.http);
    this.mcpCatalog = new MCPCatalog(this.http);
    this.userPersonas = new UserPersonas(this.http);
    // schedules reuses the same instance held under this.agents.schedules
    // so both call sites share state and there's only one resource object.
    this.schedules = this.agents.schedules;
    this.org = new Org(this.http);
    this.storefront = new Storefront(this.http);
    this.support = new Support(this.http);
    this.tenants = new Tenants(this.http);
    this.composio = new Composio(this.http);
    this.skills = new Skills(this.http);
    this.wisdom = new Wisdom(this.http);
    this.workbench = new Workbench(this.http);
    this.customAgents = new CustomAgents(this.http);
    this.pipelines = new Pipelines(this.http);
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

import { StreamError } from "../errors.js";
import type { HTTPClient } from "../http.js";
import type {
  BuiltinAgentChatTurnResult,
  BuiltinAgentInvokeOptions,
  BuiltinAgentInvokeResult,
  BuiltinAgentInvokeStreamOptions,
  BuiltinAgentListResponse,
  BuiltinAgentSendBlockingOptions,
  BuiltinAgentSendOptions,
  BuiltinAgentSession,
  BuiltinAgentSessionDetail,
  BuiltinAgentSessionListOptions,
  BuiltinAgentSessionListResponse,
  BuiltinAgentSlug,
  BuiltinAgentSummary,
  BuiltinAgentUpdate,
  CreateBuiltinAgentSessionOptions,
} from "../types.js";

function requireNonEmpty(value: string, name: string): void {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Built-in agent runs are long-lived (deep research can take many
 * minutes), so blocking invocations and streamed runs both get a
 * 20-minute deadline instead of the client-level default.
 */
const BUILTIN_AGENT_RUN_TIMEOUT_MS = 1_200_000;

/**
 * Consume a named-event SSE stream from a built-in agent run.
 *
 * Wire envelope: zero or more `event: update` frames (progress), then
 * exactly one terminal frame — `event: result` (the typed result) or
 * `event: error` (`{error}`).
 */
async function consumeRunStream<T>(
  stream: AsyncGenerator<{ event: string; data: Record<string, unknown> }>,
  onUpdate?: (update: BuiltinAgentUpdate) => void | Promise<void>,
): Promise<T> {
  let result: T | undefined;
  for await (const frame of stream) {
    switch (frame.event) {
      case "update":
        if (onUpdate) {
          await onUpdate(frame.data as unknown as BuiltinAgentUpdate);
        }
        break;
      case "result":
        result = frame.data as unknown as T;
        break;
      case "error":
        throw new StreamError(
          String(
            (frame.data as { error?: unknown }).error ??
              "built-in agent run failed",
          ),
        );
      default:
        // Unknown event names are ignored for forward compatibility.
        break;
    }
  }
  if (result === undefined) {
    throw new StreamError(
      "built-in agent stream ended without a result event",
    );
  }
  return result;
}

/**
 * Sessions created by built-in agent runs. Every invocation creates a
 * session implicitly; create one explicitly with {@link create} to chat
 * with an agent across multiple turns.
 */
export class BuiltinAgentSessions {
  constructor(private readonly http: HTTPClient) {}

  /** Create a chat session bound to a built-in agent. */
  async create(
    options: CreateBuiltinAgentSessionOptions,
  ): Promise<BuiltinAgentSession> {
    requireNonEmpty(options.agent, "options.agent");
    const body: Record<string, unknown> = { agent: options.agent };
    if (options.title) body.title = options.title;
    return this.http.post<BuiltinAgentSession>(
      "/api/v1/builtin-agents/sessions",
      body,
    );
  }

  /** List built-in agent sessions for the current project. */
  async list(
    options: BuiltinAgentSessionListOptions = {},
  ): Promise<BuiltinAgentSessionListResponse> {
    const params: Record<string, string> = {};
    if (options.limit != null) params.limit = String(options.limit);
    return this.http.get<BuiltinAgentSessionListResponse>(
      "/api/v1/builtin-agents/sessions",
      params,
    );
  }

  /** Get one session, including billed token totals. */
  async get(sessionId: string): Promise<BuiltinAgentSessionDetail> {
    requireNonEmpty(sessionId, "sessionId");
    return this.http.get<BuiltinAgentSessionDetail>(
      `/api/v1/builtin-agents/sessions/${sessionId}`,
    );
  }

  /**
   * Send a follow-up message to a session (streaming). Progress frames
   * are delivered to `onUpdate` while the agent works; resolves with
   * the final {@link BuiltinAgentChatTurnResult} once the turn ends.
   *
   * Turns are billed per token + runtime at the tenant's billing mode.
   */
  async send(
    sessionId: string,
    options: BuiltinAgentSendOptions,
  ): Promise<BuiltinAgentChatTurnResult> {
    requireNonEmpty(sessionId, "sessionId");
    requireNonEmpty(options.text, "options.text");
    const stream = this.http.streamNamedSSE(
      "POST",
      `/api/v1/builtin-agents/sessions/${sessionId}/messages`,
      { text: options.text },
      {
        params: { stream: true },
        timeoutMs: BUILTIN_AGENT_RUN_TIMEOUT_MS,
      },
    );
    return consumeRunStream<BuiltinAgentChatTurnResult>(
      stream,
      options.onUpdate,
    );
  }

  /**
   * Send a follow-up message and block until the turn completes
   * (`stream=false` — a single JSON response, no progress frames).
   */
  async sendBlocking(
    sessionId: string,
    options: BuiltinAgentSendBlockingOptions,
  ): Promise<BuiltinAgentChatTurnResult> {
    requireNonEmpty(sessionId, "sessionId");
    requireNonEmpty(options.text, "options.text");
    return this.http.request<BuiltinAgentChatTurnResult>(
      "POST",
      `/api/v1/builtin-agents/sessions/${sessionId}/messages`,
      {
        body: { text: options.text },
        params: { stream: false },
        timeoutMs: BUILTIN_AGENT_RUN_TIMEOUT_MS,
      },
    );
  }
}

/**
 * Sonzai Built-in Agents — platform-hosted vertical task agents invoked
 * by slug (current catalog: `lead_research`, `market_intel`,
 * `lead_extract`, `lead_score`, `lead_qualifier`).
 *
 * Runs are billed per token plus runtime at the tenant's billing mode;
 * the result carries `usage`, `running_seconds`, and `cost_usd`.
 *
 * @example
 * ```ts
 * // Discover the catalog (free)
 * const { agents } = await client.builtinAgents.list();
 *
 * // One-shot invocation with progress updates
 * const result = await client.builtinAgents.invokeStream("lead_research", {
 *   input: { company: "Ayala Land", region: "PH" },
 *   onUpdate: (u) => console.log(u.type, u.text ?? u.tool ?? ""),
 * });
 * console.log(result.summary, result.cost_usd);
 *
 * // Multi-turn follow-up chat
 * const session = await client.builtinAgents.sessions.create({
 *   agent: "market_intel",
 *   title: "Makati CBD office demand",
 * });
 * const turn = await client.builtinAgents.sessions.send(session.id, {
 *   text: "How does Q2 absorption compare to BGC?",
 * });
 * console.log(turn.reply);
 * ```
 */
export class BuiltinAgents {
  /** Built-in agent chat sessions (create, list, get, send). */
  readonly sessions: BuiltinAgentSessions;

  constructor(private readonly http: HTTPClient) {
    this.sessions = new BuiltinAgentSessions(http);
  }

  /** List the built-in agent catalog with provisioning state. */
  async list(): Promise<BuiltinAgentListResponse> {
    const data = await this.http.get<{
      agents: BuiltinAgentSummary[] | null;
    }>("/api/v1/builtin-agents");
    return { agents: data.agents ?? [] };
  }

  /**
   * Invoke a built-in agent and block until it finishes
   * (`stream=false` — a single JSON response).
   *
   * Runs can take many minutes; the SDK applies a 20-minute deadline to
   * this call instead of the client-level timeout. Prefer
   * {@link invokeStream} when you want progress feedback.
   */
  async invoke(
    slug: BuiltinAgentSlug,
    options: BuiltinAgentInvokeOptions,
  ): Promise<BuiltinAgentInvokeResult> {
    requireNonEmpty(slug, "slug");
    const body: Record<string, unknown> = { input: options.input };
    if (options.title) body.title = options.title;
    return this.http.request<BuiltinAgentInvokeResult>(
      "POST",
      `/api/v1/builtin-agents/${slug}/invoke`,
      {
        body,
        params: { stream: false },
        timeoutMs: BUILTIN_AGENT_RUN_TIMEOUT_MS,
      },
    );
  }

  /**
   * Invoke a built-in agent with live progress (`stream=true`).
   * `onUpdate` receives every `update` frame (status, thinking,
   * tool_use, tool_result, findings, usage, error) while the agent
   * works; resolves with the final {@link BuiltinAgentInvokeResult}.
   */
  async invokeStream(
    slug: BuiltinAgentSlug,
    options: BuiltinAgentInvokeStreamOptions,
  ): Promise<BuiltinAgentInvokeResult> {
    requireNonEmpty(slug, "slug");
    const body: Record<string, unknown> = { input: options.input };
    if (options.title) body.title = options.title;
    const stream = this.http.streamNamedSSE(
      "POST",
      `/api/v1/builtin-agents/${slug}/invoke`,
      body,
      {
        params: { stream: true },
        timeoutMs: BUILTIN_AGENT_RUN_TIMEOUT_MS,
      },
    );
    return consumeRunStream<BuiltinAgentInvokeResult>(
      stream,
      options.onUpdate,
    );
  }
}

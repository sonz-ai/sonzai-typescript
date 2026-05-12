import type { HTTPClient } from "../http.js";
import type {
  EnrichedContextResponse,
  GetContextOptions,
  SessionEndOptions,
  SessionResponse,
  TurnOptions,
  TurnResponse,
  TurnStatusResponse,
} from "../types.js";
import type { Sessions } from "./sessions.js";

/**
 * Handwritten ergonomic wrapper around the realtime per-turn API.
 *
 * A `Session` binds `agentId` + `userId` + `sessionId` (and optional
 * provider/model defaults) so callers don't have to repeat them on
 * every turn. Methods are thin pass-throughs to the auto-generated
 * routes:
 *
 *   - `context()`   → GET  /agents/{agentId}/context
 *   - `turn()`      → POST /agents/{agentId}/sessions/{sessionId}/turn
 *   - `status()`    → GET  /agents/{agentId}/turns/{extractionId}/status
 *   - `end()`       → POST /agents/{agentId}/sessions/end
 *
 * Per-call `provider`/`model` on .turn() override the session-level
 * defaults; if neither is set the server-side resolver picks the
 * tenant default (e.g. gemini-3.1-flash-lite).
 *
 * Backward compat: `success` mirrors the legacy `SessionResponse`
 * shape so existing callers doing
 * `const r = await sessions.start(...); r.success` keep working
 * after `sessions.start()` was changed to return a Session handle.
 */
export class Session implements SessionResponse {
  readonly agentId: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly instanceId?: string;
  readonly provider?: string;
  readonly model?: string;
  /** Mirrors the `/sessions/start` response body for backward compat. */
  readonly success: boolean;

  constructor(
    private readonly http: HTTPClient,
    private readonly sessions: Sessions,
    args: {
      agentId: string;
      userId: string;
      sessionId: string;
      instanceId?: string;
      provider?: string;
      model?: string;
      startResponse?: SessionResponse;
    },
  ) {
    this.agentId = args.agentId;
    this.userId = args.userId;
    this.sessionId = args.sessionId;
    this.instanceId = args.instanceId;
    this.provider = args.provider;
    this.model = args.model;
    this.success = args.startResponse?.success ?? true;
  }

  /**
   * Fetch enriched agent context (the same shape as GET /agents/{id}/context).
   * Use this to build the LLM prompt before sending a turn.
   */
  async context(
    options: Omit<GetContextOptions, "userId"> & { userId?: string } = {},
  ): Promise<EnrichedContextResponse> {
    const params: Record<string, string> = {
      userId: options.userId ?? this.userId,
      sessionId: options.sessionId ?? this.sessionId,
    };
    const instanceId = options.instanceId ?? this.instanceId;
    if (instanceId) params.instanceId = instanceId;
    if (options.query) params.query = options.query;
    if (options.language) params.language = options.language;
    if (options.timezone) params.timezone = options.timezone;
    const raw = await this.http.get<Record<string, unknown>>(
      `/api/v1/agents/${this.agentId}/context`,
      params,
    );
    if ("game_context" in raw && !("backend_context" in raw)) {
      raw.backend_context = raw.game_context;
      delete raw.game_context;
    }
    return raw as EnrichedContextResponse;
  }

  /**
   * Submit a single conversation turn. Runs sync mood-only extraction
   * inline and queues the rest of post-processing as a deferred work
   * item. Returns the extraction_id (poll via .status()).
   */
  async turn(options: TurnOptions): Promise<TurnResponse> {
    return this.sessions.submitTurn(this.agentId, this.sessionId, {
      ...options,
      userId: options.userId ?? this.userId,
      instanceId: options.instanceId ?? this.instanceId,
      provider: options.provider ?? this.provider,
      model: options.model ?? this.model,
    });
  }

  /** Poll the deferred-extraction state for a previously-submitted turn. */
  async status(extractionId: string): Promise<TurnStatusResponse> {
    return this.sessions.getTurnStatus(this.agentId, extractionId);
  }

  /**
   * Close the session via POST /agents/{agentId}/sessions/end. Mirrors
   * the underlying `Sessions.end` polling behaviour — async-mode
   * servers return a processing_id and this method blocks until the
   * pipeline reports done|failed (or the poll timeout fires).
   */
  async end(
    options: Partial<Omit<SessionEndOptions, "userId" | "sessionId">> = {},
  ): Promise<SessionResponse> {
    return this.sessions.end(this.agentId, {
      userId: this.userId,
      sessionId: this.sessionId,
      instanceId: options.instanceId ?? this.instanceId,
      totalMessages: options.totalMessages,
      durationSeconds: options.durationSeconds,
      messages: options.messages,
      userDisplayName: options.userDisplayName,
      userTimezone: options.userTimezone,
      wait: options.wait,
      pollTimeoutMs: options.pollTimeoutMs,
    });
  }

  // -------------------------------------------------------------------
  // Per-user proxy methods — auto-scope by (agentId, userId, instanceId)
  // -------------------------------------------------------------------
  //
  // The platform scopes per-user rows under `inst:<instanceId>:<userId>`
  // when a session was started with an instanceId. Calling the
  // agent-level helpers directly (e.g. `client.agents.getMood(...)`)
  // without instanceId silently targets the UNSCOPED row, which
  // `session.context()` then never reads. The reproduction in the demo:
  // user applies a mood override, get_mood confirms the new value, but
  // the next reply uses the old mood because /context reads the scoped
  // row. These wrappers eliminate that footgun by always forwarding the
  // session's instanceId.

  /** Hard-set mood (0-100 per dimension), auto-scoped to this session's user. */
  async updateMood(args: {
    valence: number;
    arousal: number;
    tension: number;
    affiliation: number;
  }): Promise<unknown> {
    // http.put doesn't accept params kwarg — inline scope into the URL.
    const qs = new URLSearchParams({ user_id: this.userId });
    if (this.instanceId) qs.append("instance_id", this.instanceId);
    return this.http.put<unknown>(
      `/api/v1/agents/${this.agentId}/mood?${qs.toString()}`,
      args,
    );
  }

  /** Current mood (0-100 per dimension) for this session's user. */
  async getMood(): Promise<unknown> {
    const params: Record<string, string> = { user_id: this.userId };
    if (this.instanceId) params.instance_id = this.instanceId;
    return this.http.get<unknown>(`/api/v1/agents/${this.agentId}/mood`, params);
  }

  /** Active facts about this session's user. */
  async listFacts(opts: { limit?: number } = {}): Promise<unknown> {
    const params: Record<string, string | number> = {};
    if (this.instanceId) params.instance_id = this.instanceId;
    if (opts.limit) params.limit = opts.limit;
    return this.http.get<unknown>(
      `/api/v1/agents/${this.agentId}/users/${this.userId}/facts`,
      params as Record<string, string>,
    );
  }

  /** Inventory query for this session's user. */
  async queryInventory(
    opts: { mode?: string; limit?: number } = {},
  ): Promise<unknown> {
    const params: Record<string, string | number> = {};
    if (this.instanceId) params.instance_id = this.instanceId;
    if (opts.mode) params.mode = opts.mode;
    if (opts.limit) params.limit = opts.limit;
    return this.http.get<unknown>(
      `/api/v1/agents/${this.agentId}/users/${this.userId}/inventory`,
      params as Record<string, string>,
    );
  }

  /** Concept-graph constellation for this session's user. */
  async getConstellation(): Promise<unknown> {
    const params: Record<string, string> = { user_id: this.userId };
    if (this.instanceId) params.instance_id = this.instanceId;
    return this.http.get<unknown>(
      `/api/v1/agents/${this.agentId}/constellation`,
      params,
    );
  }

  /** Schedule a proactive wakeup for this session's user. */
  async scheduleWakeup(args: {
    checkType: string;
    intent: string;
    delayHours?: number;
  }): Promise<unknown> {
    const params: Record<string, string> = { user_id: this.userId };
    if (this.instanceId) params.instance_id = this.instanceId;
    return this.http.post<unknown>(
      `/api/v1/agents/${this.agentId}/wakeups`,
      {
        check_type: args.checkType,
        intent: args.intent,
        delay_hours: args.delayHours ?? 24,
      },
      params,
    );
  }
}

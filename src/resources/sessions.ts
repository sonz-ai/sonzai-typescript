import { SonzaiError } from "../errors.js";
import type { HTTPClient } from "../http.js";
import type {
  SessionEndOptions,
  SessionResponse,
  SessionStartOptions,
  ToolDefinition,
} from "../types.js";

// Polling tunables for the async session-end path. Match the Python +
// Go SDKs so all three behave identically under ENABLE_ASYNC_SESSION_END=true.
const SESSION_END_POLL_INITIAL_INTERVAL_MS = 500;
const SESSION_END_POLL_MAX_INTERVAL_MS = 5_000;
const SESSION_END_POLL_BACKOFF = 1.5;
const SESSION_END_OVERALL_TIMEOUT_MS = 900_000;

interface SessionEndAcceptBody {
  success?: boolean;
  async?: boolean;
  processing_id?: string;
  status_url?: string;
  session_id?: string;
  agent_id?: string;
  enqueued_at?: string;
}

interface SessionEndStatusBody {
  state: "pending" | "processing" | "done" | "failed";
  enqueued_at: string;
  started_at?: string;
  finished_at?: string;
  session_id: string;
  agent_id: string;
  error?: string;
  attempt?: number;
}

export class Sessions {
  constructor(private readonly http: HTTPClient) {}

  /** Start a chat session. */
  async start(
    agentId: string,
    options: SessionStartOptions,
  ): Promise<SessionResponse> {
    const body: Record<string, unknown> = {
      user_id: options.userId,
      session_id: options.sessionId,
    };
    if (options.instanceId) body.instance_id = options.instanceId;
    if (options.userDisplayName)
      body.user_display_name = options.userDisplayName;
    if (options.toolDefinitions)
      body.tool_definitions = options.toolDefinitions;

    return this.http.post<SessionResponse>(
      `/api/v1/agents/${agentId}/sessions/start`,
      body,
    );
  }

  /** End a chat session.
   *
   * Behaviour matrix vs. the server:
   *   - Legacy 200 {success:true,async:*} — return immediately.
   *   - 202 with processing_id (ENABLE_ASYNC_SESSION_END=true) — poll
   *     /sessions/end/status/{pid} until state is done or failed so the
   *     caller sees the same blocking-call shape it always had.
   *     ``options.pollTimeoutMs`` bounds the overall poll window.
   *     Pass ``wait:true`` to force the inline path on an async server.
   */
  async end(
    agentId: string,
    options: SessionEndOptions,
  ): Promise<SessionResponse> {
    const body: Record<string, unknown> = {
      user_id: options.userId,
      session_id: options.sessionId,
      total_messages: options.totalMessages ?? 0,
      duration_seconds: options.durationSeconds ?? 0,
    };
    if (options.instanceId) body.instance_id = options.instanceId;
    if (options.messages) body.messages = options.messages;
    if (options.userDisplayName) body.user_display_name = options.userDisplayName;
    if (options.userTimezone) body.user_timezone = options.userTimezone;
    if (options.wait != null) body.wait = options.wait;

    const accept = await this.http.post<SessionEndAcceptBody>(
      `/api/v1/agents/${agentId}/sessions/end`,
      body,
    );

    if (!accept?.processing_id) {
      return { success: accept?.success ?? true } as SessionResponse;
    }

    const overallTimeout = options.pollTimeoutMs ?? SESSION_END_OVERALL_TIMEOUT_MS;
    await this.pollSessionEndStatus(accept.processing_id, overallTimeout);
    return { success: true };
  }

  /** Poll GET /sessions/end/status/{pid} until the pipeline reaches a
   *  terminal state. Resolves on "done"; rejects with SonzaiError on
   *  "failed" or on overall timeout. */
  private async pollSessionEndStatus(
    processingId: string,
    overallTimeoutMs: number,
  ): Promise<void> {
    const deadline = Date.now() + overallTimeoutMs;
    let interval = SESSION_END_POLL_INITIAL_INTERVAL_MS;
    let lastState: string | undefined;
    for (;;) {
      const status = await this.http.get<SessionEndStatusBody>(
        `/api/v1/sessions/end/status/${processingId}`,
      );
      lastState = status.state;
      if (status.state === "done") return;
      if (status.state === "failed") {
        throw new SonzaiError(
          `session end failed: ${status.error ?? "unknown"}`,
        );
      }
      if (Date.now() >= deadline) {
        throw new SonzaiError(
          `session end poll timed out after ${overallTimeoutMs}ms (last state: ${lastState})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.min(
        interval * SESSION_END_POLL_BACKOFF,
        SESSION_END_POLL_MAX_INTERVAL_MS,
      );
    }
  }

  /** Set the tools available for a specific session. */
  async setTools(agentId: string, sessionId: string, tools: ToolDefinition[]): Promise<SessionResponse> {
    return this.http.put<SessionResponse>(`/api/v1/agents/${agentId}/sessions/${sessionId}/tools`, tools as unknown as Record<string, unknown>);
  }
}

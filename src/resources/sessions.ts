import type { HTTPClient } from "../http.js";
import type {
  SessionEndOptions,
  SessionResponse,
  SessionStartOptions,
  ToolDefinition,
} from "../types.js";

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

    return this.http.post<SessionResponse>(
      `/api/v1/agents/${agentId}/sessions/start`,
      body,
    );
  }

  /** End a chat session. */
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

    return this.http.post<SessionResponse>(
      `/api/v1/agents/${agentId}/sessions/end`,
      body,
    );
  }

  /** Set the tools available for a specific session. */
  async setTools(agentId: string, sessionId: string, tools: ToolDefinition[]): Promise<SessionResponse> {
    return this.http.put<SessionResponse>(`/api/v1/agents/${agentId}/sessions/${sessionId}/tools`, tools as unknown as Record<string, unknown>);
  }
}

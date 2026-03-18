import type { HTTPClient } from "../http.js";
import type {
  BatchPersonalityResponse,
  PersonalityGetOptions,
  PersonalityResponse,
  PersonalityUpdateOptions,
  PersonalityUpdateResponse,
  RecentShiftsResponse,
  SignificantMomentsResponse,
  UserOverlayDetailResponse,
  UserOverlayOptions,
  UserOverlaysListResponse,
} from "../types.js";

export class Personality {
  constructor(private readonly http: HTTPClient) {}

  /** Get personality profile and evolution history. */
  async get(
    agentId: string,
    options: PersonalityGetOptions = {},
  ): Promise<PersonalityResponse> {
    return this.http.get<PersonalityResponse>(
      `/api/v1/agents/${agentId}/personality`,
      {
        history_limit: options.historyLimit,
        since: options.since,
      },
    );
  }

  /** Update an agent's Big5 personality scores. */
  async update(
    agentId: string,
    options: PersonalityUpdateOptions,
  ): Promise<PersonalityUpdateResponse> {
    const body: Record<string, unknown> = { big5: options.big5 };
    if (options.assessmentMethod)
      body.assessment_method = options.assessmentMethod;
    if (options.totalExchanges)
      body.total_exchanges = options.totalExchanges;

    return this.http.put<PersonalityUpdateResponse>(
      `/api/v1/agents/${agentId}/personality`,
      body,
    );
  }

  /** Get personality profiles for multiple agents in a single request. */
  async batchGet(agentIds: string[]): Promise<BatchPersonalityResponse> {
    return this.http.post<BatchPersonalityResponse>("/api/v1/agents/personalities/batch", { agent_ids: agentIds });
  }

  /** Get significant moments for an agent's personality evolution. */
  async getSignificantMoments(agentId: string, options?: { limit?: number }): Promise<SignificantMomentsResponse> {
    const params: Record<string, string> = {};
    if (options?.limit) params.limit = String(options.limit);
    return this.http.get<SignificantMomentsResponse>(`/api/v1/agents/${agentId}/personality/significant-moments`, params);
  }

  /** Get recent personality shifts for an agent. */
  async getRecentShifts(agentId: string): Promise<RecentShiftsResponse> {
    return this.http.get<RecentShiftsResponse>(`/api/v1/agents/${agentId}/personality/recent-shifts`);
  }

  /** List all user-specific personality overlays for an agent. */
  async listUserOverlays(agentId: string): Promise<UserOverlaysListResponse> {
    return this.http.get<UserOverlaysListResponse>(`/api/v1/agents/${agentId}/personality/users`);
  }

  /** Get a specific user's personality overlay for an agent. */
  async getUserOverlay(agentId: string, userId: string, options?: UserOverlayOptions): Promise<UserOverlayDetailResponse> {
    const params: Record<string, string> = {};
    if (options?.instanceId) params.instance_id = options.instanceId;
    if (options?.since) params.since = options.since;
    return this.http.get<UserOverlayDetailResponse>(`/api/v1/agents/${agentId}/personality/users/${userId}`, params);
  }
}

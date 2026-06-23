import type { HTTPClient } from "../http.js";
import type {
  CustomAgent,
  CustomAgentInput,
  CustomAgentListResponse,
} from "../types.js";

/** Project-scoped custom agent management operations. */
export class CustomAgents {
  constructor(private readonly http: HTTPClient) {}

  /** List all custom agents for the current project. */
  async list(): Promise<CustomAgentListResponse> {
    return this.http.get<CustomAgentListResponse>("/api/v1/custom-agents");
  }

  /** Create a new custom agent. */
  async create(input: CustomAgentInput): Promise<CustomAgent> {
    return this.http.post<CustomAgent>(
      "/api/v1/custom-agents",
      input as unknown as Record<string, unknown>,
    );
  }

  /** Get a single custom agent by id. */
  async get(agentId: string): Promise<CustomAgent> {
    return this.http.get<CustomAgent>(`/api/v1/custom-agents/${agentId}`);
  }

  /** Update an existing custom agent. */
  async update(
    agentId: string,
    input: CustomAgentInput,
  ): Promise<CustomAgent> {
    return this.http.put<CustomAgent>(
      `/api/v1/custom-agents/${agentId}`,
      input as unknown as Record<string, unknown>,
    );
  }

  /** Delete a custom agent. */
  async delete(agentId: string): Promise<void> {
    await this.http.delete(`/api/v1/custom-agents/${agentId}`);
  }
}

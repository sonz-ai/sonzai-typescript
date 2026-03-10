import type { HTTPClient } from "../http.js";
import type {
  AgentInstance,
  InstanceCreateOptions,
  InstanceListResponse,
  SessionResponse,
} from "../types.js";

export class Instances {
  constructor(private readonly http: HTTPClient) {}

  /** List all instances for an agent. */
  async list(agentId: string): Promise<InstanceListResponse> {
    return this.http.get<InstanceListResponse>(
      `/api/v1/agents/${agentId}/instances`,
    );
  }

  /** Create a new agent instance. */
  async create(
    agentId: string,
    options: InstanceCreateOptions,
  ): Promise<AgentInstance> {
    const body: Record<string, unknown> = { name: options.name };
    if (options.description) body.description = options.description;

    return this.http.post<AgentInstance>(
      `/api/v1/agents/${agentId}/instances`,
      body,
    );
  }

  /** Get a specific instance. */
  async get(agentId: string, instanceId: string): Promise<AgentInstance> {
    return this.http.get<AgentInstance>(
      `/api/v1/agents/${agentId}/instances/${instanceId}`,
    );
  }

  /** Delete an instance. */
  async delete(agentId: string, instanceId: string): Promise<SessionResponse> {
    return this.http.delete<SessionResponse>(
      `/api/v1/agents/${agentId}/instances/${instanceId}`,
    );
  }

  /** Reset an instance (clears all context data). */
  async reset(agentId: string, instanceId: string): Promise<AgentInstance> {
    return this.http.post<AgentInstance>(
      `/api/v1/agents/${agentId}/instances/${instanceId}/reset`,
    );
  }
}

import type { HTTPClient } from "../http.js";
import type {
  CustomState,
  CustomStateCreateOptions,
  CustomStateListOptions,
  CustomStateListResponse,
  CustomStateUpdateOptions,
} from "../types.js";

/** Custom state operations for agents. */
export class CustomStates {
  constructor(private readonly http: HTTPClient) {}

  /** List custom states for an agent. */
  async list(
    agentId: string,
    options: CustomStateListOptions = {},
  ): Promise<CustomStateListResponse> {
    return this.http.get<CustomStateListResponse>(
      `/api/v1/agents/${agentId}/custom-states`,
      {
        scope: options.scope,
        user_id: options.userId,
        instance_id: options.instanceId,
      },
    );
  }

  /** Create a new custom state. */
  async create(
    agentId: string,
    options: CustomStateCreateOptions,
  ): Promise<CustomState> {
    const body: Record<string, unknown> = {
      key: options.key,
      value: options.value,
    };
    if (options.scope) body.scope = options.scope;
    if (options.contentType) body.content_type = options.contentType;
    if (options.userId) body.user_id = options.userId;
    if (options.instanceId) body.instance_id = options.instanceId;

    return this.http.post<CustomState>(
      `/api/v1/agents/${agentId}/custom-states`,
      body,
    );
  }

  /** Update a custom state. */
  async update(
    agentId: string,
    stateId: string,
    options: CustomStateUpdateOptions,
  ): Promise<CustomState> {
    const body: Record<string, unknown> = { value: options.value };
    if (options.contentType) body.content_type = options.contentType;

    return this.http.put<CustomState>(
      `/api/v1/agents/${agentId}/custom-states/${stateId}`,
      body,
    );
  }

  /** Delete a custom state. */
  async delete(agentId: string, stateId: string): Promise<void> {
    await this.http.delete(
      `/api/v1/agents/${agentId}/custom-states/${stateId}`,
    );
  }
}

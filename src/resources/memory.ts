import type { HTTPClient } from "../http.js";
import type {
  MemoryListOptions,
  MemoryResponse,
  MemorySearchOptions,
  MemorySearchResponse,
  MemoryTimelineOptions,
  MemoryTimelineResponse,
} from "../types.js";

export class Memory {
  constructor(private readonly http: HTTPClient) {}

  /** Get the memory tree for an agent. */
  async list(
    agentId: string,
    options: MemoryListOptions = {},
  ): Promise<MemoryResponse> {
    return this.http.get<MemoryResponse>(
      `/api/v1/agents/${agentId}/memory`,
      {
        user_id: options.userId,
        instance_id: options.instanceId,
        parent_id: options.parentId,
        include_contents: options.includeContents ? "true" : undefined,
        limit: options.limit,
      },
    );
  }

  /** Search agent memories. */
  async search(
    agentId: string,
    options: MemorySearchOptions,
  ): Promise<MemorySearchResponse> {
    return this.http.get<MemorySearchResponse>(
      `/api/v1/agents/${agentId}/memory/search`,
      {
        q: options.query,
        instance_id: options.instanceId,
        limit: options.limit,
      },
    );
  }

  /** Get memory timeline for an agent. */
  async timeline(
    agentId: string,
    options: MemoryTimelineOptions = {},
  ): Promise<MemoryTimelineResponse> {
    return this.http.get<MemoryTimelineResponse>(
      `/api/v1/agents/${agentId}/memory/timeline`,
      {
        user_id: options.userId,
        instance_id: options.instanceId,
        start: options.start,
        end: options.end,
      },
    );
  }
}

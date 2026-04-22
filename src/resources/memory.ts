import type { HTTPClient } from "../http.js";
import type {
  AtomicFact,
  CreateFactOptions,
  DeleteWisdomResponse,
  FactHistoryResponse,
  FactListOptions,
  FactListResponse,
  MemoryListOptions,
  MemoryResetOptions,
  MemoryResetResponse,
  MemoryResponse,
  MemorySearchOptions,
  MemorySearchResponse,
  MemoryTimelineOptions,
  MemoryTimelineResponse,
  SeedMemoriesOptions,
  SeedMemoriesResponse,
  UpdateFactOptions,
  WisdomAuditResponse,
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
        user_id: options.user_id,
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

  /** Seed bulk memories for an agent. */
  async seed(
    agentId: string,
    options: SeedMemoriesOptions,
  ): Promise<SeedMemoriesResponse> {
    const body: Record<string, unknown> = {
      user_id: options.userId,
      memories: options.memories,
    };
    if (options.instanceId) body.instance_id = options.instanceId;

    return this.http.post<SeedMemoriesResponse>(
      `/api/v1/agents/${agentId}/memory/seed`,
      body,
    );
  }

  /** List extracted facts for an agent. */
  async listFacts(
    agentId: string,
    options: FactListOptions = {},
  ): Promise<FactListResponse> {
    return this.http.get<FactListResponse>(
      `/api/v1/agents/${agentId}/memory/facts`,
      {
        user_id: options.userId,
        fact_type: options.factType,
        limit: options.limit,
        offset: options.offset,
      },
    );
  }

  /** Reset (delete) all memory for an agent scoped to a user. */
  async reset(
    agentId: string,
    options: MemoryResetOptions,
  ): Promise<MemoryResetResponse> {
    return this.http.delete<MemoryResetResponse>(
      `/api/v1/agents/${agentId}/memory`,
      {
        user_id: options.userId,
        instance_id: options.instanceId,
      },
    );
  }

  /** Create a new fact for an agent. Facts are tagged source_type='manual'. */
  async createFact(
    agentId: string,
    options: CreateFactOptions,
  ): Promise<AtomicFact> {
    const body: Record<string, unknown> = {
      content: options.content,
    };
    if (options.userId) body.user_id = options.userId;
    if (options.factType) body.fact_type = options.factType;
    if (options.importance != null) body.importance = options.importance;
    if (options.confidence != null) body.confidence = options.confidence;
    if (options.entities) body.entities = options.entities;
    if (options.nodeId) body.node_id = options.nodeId;
    if (options.metadata) body.metadata = options.metadata;

    return this.http.post<AtomicFact>(
      `/api/v1/agents/${agentId}/memory/facts`,
      body,
    );
  }

  /** Update an existing fact by ID. */
  async updateFact(
    agentId: string,
    factId: string,
    options: UpdateFactOptions,
  ): Promise<AtomicFact> {
    const body: Record<string, unknown> = {};
    if (options.content) body.content = options.content;
    if (options.factType) body.fact_type = options.factType;
    if (options.importance != null) body.importance = options.importance;
    if (options.confidence != null) body.confidence = options.confidence;
    if (options.entities) body.entities = options.entities;
    if (options.metadata) body.metadata = options.metadata;

    return this.http.put<AtomicFact>(
      `/api/v1/agents/${agentId}/memory/facts/${factId}`,
      body,
    );
  }

  /** Delete a fact by ID. */
  async deleteFact(agentId: string, factId: string): Promise<void> {
    await this.http.delete(`/api/v1/agents/${agentId}/memory/facts/${factId}`);
  }

  /** Get the version history of a specific fact. */
  async getFactHistory(agentId: string, factId: string): Promise<FactHistoryResponse> {
    return this.http.get<FactHistoryResponse>(`/api/v1/agents/${agentId}/memory/fact/${factId}/history`);
  }

  /** Delete a wisdom fact by ID. */
  async deleteWisdomFact(
    agentId: string,
    factId: string,
  ): Promise<DeleteWisdomResponse> {
    return this.http.delete<DeleteWisdomResponse>(
      `/api/v1/agents/${agentId}/memory/wisdom/${factId}`,
    );
  }

  /** Get the audit trail for a wisdom fact. */
  async getWisdomAudit(
    agentId: string,
    factId: string,
  ): Promise<WisdomAuditResponse> {
    return this.http.get<WisdomAuditResponse>(
      `/api/v1/agents/${agentId}/memory/wisdom/audit/${factId}`,
    );
  }
}

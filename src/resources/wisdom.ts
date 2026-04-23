import type { HTTPClient } from "../http.js";
import type {
  CreateWisdomAttributedBody,
  CreateWisdomAttributedOutputBody,
  CreateWisdomRelationBody,
  CreateWisdomRelationOutputBody,
  DeleteWisdomResponse,
  ListWisdomAttributedOutputBody,
  ListWisdomAuditOutputBody,
  ListWisdomRelationsOutputBody,
  ReplaceWisdomAttributedInputBody,
  ReplaceWisdomAttributedOutputBody,
  WisdomAuditResponse,
  WisdomImportInputBody,
  WisdomImportResponse,
} from "../types.js";

/**
 * Attributed wisdom — person/entity-attributed facts an agent can share
 * across users. Gated on the `WisdomPublicSharing` capability. Writes go
 * through a privacy-floor blocklist + an SP1-routed semantic validator so
 * sensitive categories (compensation, health, politics, etc.) never
 * persist regardless of provenance.
 */
export class Wisdom {
  constructor(private readonly http: HTTPClient) {}

  /** List every attributed fact the agent has recorded. */
  async listAttributed(
    agentId: string,
  ): Promise<ListWisdomAttributedOutputBody> {
    return this.http.get<ListWisdomAttributedOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/attributed`,
    );
  }

  /** Record a new attributed fact about a person or entity. */
  async createAttributed(
    agentId: string,
    body: CreateWisdomAttributedBody,
  ): Promise<CreateWisdomAttributedOutputBody> {
    return this.http.post<CreateWisdomAttributedOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/attributed`,
      body,
    );
  }

  /** List attributed facts filed under a specific entity. */
  async listAttributedByEntity(
    agentId: string,
    entityType: string,
    entityId: string,
  ): Promise<ListWisdomAttributedOutputBody> {
    return this.http.get<ListWisdomAttributedOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/attributed/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    );
  }

  /** Replace the value of a (entity, category) fact. */
  async replaceAttributed(
    agentId: string,
    entityType: string,
    entityId: string,
    category: string,
    body: ReplaceWisdomAttributedInputBody,
  ): Promise<ReplaceWisdomAttributedOutputBody> {
    return this.http.put<ReplaceWisdomAttributedOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/attributed/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/${encodeURIComponent(category)}`,
      body,
    );
  }

  /** Delete a (entity, category) fact. Idempotent. */
  async deleteAttributed(
    agentId: string,
    entityType: string,
    entityId: string,
    category: string,
  ): Promise<DeleteWisdomResponse> {
    return this.http.delete<DeleteWisdomResponse>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/attributed/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/${encodeURIComponent(category)}`,
    );
  }

  /** Bulk import attributed facts from CSV or JSON. */
  async importAttributed(
    agentId: string,
    body: WisdomImportInputBody,
  ): Promise<WisdomImportResponse> {
    return this.http.post<WisdomImportResponse>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/attributed/import`,
      body,
    );
  }

  /** List the agent's attributed relations (directed edges). */
  async listRelations(
    agentId: string,
  ): Promise<ListWisdomRelationsOutputBody> {
    return this.http.get<ListWisdomRelationsOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/relations`,
    );
  }

  /** Record a directed relation between two entities. */
  async createRelation(
    agentId: string,
    body: CreateWisdomRelationBody,
  ): Promise<CreateWisdomRelationOutputBody> {
    return this.http.post<CreateWisdomRelationOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/relations`,
      body,
    );
  }

  /** Delete a relation by ID. Idempotent. */
  async deleteRelation(
    agentId: string,
    relationId: string,
  ): Promise<WisdomAuditResponse> {
    return this.http.delete<WisdomAuditResponse>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/relations/${encodeURIComponent(relationId)}`,
    );
  }

  /**
   * Read the disclosure audit trail — one row per fact-per-turn the agent
   * has surfaced. Useful for compliance review.
   */
  async listAudit(
    agentId: string,
    params: { from?: string; to?: string; limit?: number } = {},
  ): Promise<ListWisdomAuditOutputBody> {
    const q: Record<string, string | number> = {};
    if (params.from) q.from = params.from;
    if (params.to) q.to = params.to;
    if (params.limit !== undefined) q.limit = params.limit;
    return this.http.get<ListWisdomAuditOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/wisdom/audit`,
      q,
    );
  }
}

import type { HTTPClient } from "../http.js";
import type {
  KBDocument,
  KBDocumentListResponse,
  KBNode,
  KBNodeWithScope,
  KBNodeListResponse,
  KBNodeDetailResponse,
  KBNodeHistoryResponse,
  KBSearchResponse,
  KBSearchOptions,
  KBEntitySchema,
  KBSchemaListResponse,
  KBStats,
  InsertFactsOptions,
  InsertFactsResponse,
  CreateOrgNodeOptions,
  CreateSchemaOptions,
  KBAnalyticsRule,
  KBAnalyticsRuleListResponse,
  CreateAnalyticsRuleOptions,
  UpdateAnalyticsRuleOptions,
  KBRecommendationsResponse,
  KBTrendsResponse,
  KBTrendRankingsResponse,
  KBConversionsResponse,
  RecordFeedbackOptions,
  KBBulkUpdateOptions,
  KBBulkUpdateResponse,
} from "../types.js";

/** Project-scoped knowledge base operations. */
export class Knowledge {
  constructor(private readonly http: HTTPClient) {}

  // -- Documents --

  /** List documents for a project. */
  async listDocuments(
    projectId: string,
    limit?: number,
  ): Promise<KBDocumentListResponse> {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    return this.http.get<KBDocumentListResponse>(
      `/api/v1/projects/${projectId}/knowledge/documents`,
      params,
    );
  }

  /** Get a single document. */
  async getDocument(projectId: string, docId: string): Promise<KBDocument> {
    return this.http.get<KBDocument>(
      `/api/v1/projects/${projectId}/knowledge/documents/${docId}`,
    );
  }

  /** Delete a document. */
  async deleteDocument(projectId: string, docId: string): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${projectId}/knowledge/documents/${docId}`,
    );
  }

  async uploadDocument(
    projectId: string,
    fileName: string,
    fileData: Blob | Buffer | ArrayBuffer,
    contentType = "application/octet-stream",
  ): Promise<KBDocument> {
    return this.http.uploadFile<KBDocument>(
      `/api/v1/projects/${projectId}/knowledge/documents`,
      fileName,
      fileData,
      contentType,
    );
  }

  // -- Facts / Graph --

  /** Insert entities and relationships into the knowledge graph. */
  async insertFacts(
    projectId: string,
    options: InsertFactsOptions,
  ): Promise<InsertFactsResponse> {
    return this.http.post<InsertFactsResponse>(
      `/api/v1/projects/${projectId}/knowledge/facts`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** List knowledge graph nodes. */
  async listNodes(
    projectId: string,
    options: {
      type?: string;
      limit?: number;
      offset?: number;
      sort_by?: string;
      sort_order?: string;
      properties?: Record<string, string>;
    } = {},
  ): Promise<KBNodeListResponse> {
    const params: Record<string, string> = {};
    if (options.type) params.type = options.type;
    if (options.limit) params.limit = String(options.limit);
    if (options.offset) params.offset = String(options.offset);
    if (options.sort_by) params.sort_by = options.sort_by;
    if (options.sort_order) params.sort_order = options.sort_order;
    if (options.properties) {
      for (const [k, v] of Object.entries(options.properties)) {
        params[`properties.${k}`] = v;
      }
    }
    return this.http.get<KBNodeListResponse>(
      `/api/v1/projects/${projectId}/knowledge/nodes`,
      params,
    );
  }

  /** Get a node with connected edges. */
  async getNode(
    projectId: string,
    nodeId: string,
    includeHistory = false,
  ): Promise<KBNodeDetailResponse> {
    const params: Record<string, string> = {};
    if (includeHistory) params.history = "true";
    return this.http.get<KBNodeDetailResponse>(
      `/api/v1/projects/${projectId}/knowledge/nodes/${nodeId}`,
      params,
    );
  }

  /** Soft-delete a node. */
  async deleteNode(projectId: string, nodeId: string): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${projectId}/knowledge/nodes/${nodeId}`,
    );
  }

  /** Get version history for a node. */
  async getNodeHistory(
    projectId: string,
    nodeId: string,
    limit?: number,
  ): Promise<KBNodeHistoryResponse> {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    return this.http.get<KBNodeHistoryResponse>(
      `/api/v1/projects/${projectId}/knowledge/nodes/${nodeId}/history`,
      params,
    );
  }

  // -- Search --

  /** BM25 search with 1-hop graph traversal. */
  async search(
    projectId: string,
    options: KBSearchOptions,
  ): Promise<KBSearchResponse> {
    const params: Record<string, string> = { q: options.query };
    if (options.limit) params.limit = String(options.limit);
    if (options.includeHistory) params.history = "true";
    if (options.entityTypes) params.type = options.entityTypes;
    if (options.filters) params.filters = options.filters;
    if (options.hops) params.hops = String(options.hops);
    return this.http.get<KBSearchResponse>(
      `/api/v1/projects/${projectId}/knowledge/search`,
      params,
    );
  }

  // -- Schemas --

  /** Create an entity schema. */
  async createSchema(
    projectId: string,
    options: CreateSchemaOptions,
  ): Promise<KBEntitySchema> {
    return this.http.post<KBEntitySchema>(
      `/api/v1/projects/${projectId}/knowledge/schemas`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** List entity schemas. */
  async listSchemas(projectId: string): Promise<KBSchemaListResponse> {
    return this.http.get<KBSchemaListResponse>(
      `/api/v1/projects/${projectId}/knowledge/schemas`,
    );
  }

  /** Update an entity schema. */
  async updateSchema(
    projectId: string,
    schemaId: string,
    options: CreateSchemaOptions,
  ): Promise<KBEntitySchema> {
    return this.http.put<KBEntitySchema>(
      `/api/v1/projects/${projectId}/knowledge/schemas/${schemaId}`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Delete an entity schema. */
  async deleteSchema(projectId: string, schemaId: string): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${projectId}/knowledge/schemas/${schemaId}`,
    );
  }

  // -- Stats --

  /** Get knowledge base statistics. */
  async getStats(projectId: string): Promise<KBStats> {
    return this.http.get<KBStats>(
      `/api/v1/projects/${projectId}/knowledge/stats`,
    );
  }

  // -- Analytics Rules --

  /** Create an analytics rule. */
  async createAnalyticsRule(
    projectId: string,
    options: CreateAnalyticsRuleOptions,
  ): Promise<KBAnalyticsRule> {
    return this.http.post<KBAnalyticsRule>(
      `/api/v1/projects/${projectId}/knowledge/analytics/rules`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** List analytics rules. */
  async listAnalyticsRules(
    projectId: string,
  ): Promise<KBAnalyticsRuleListResponse> {
    return this.http.get<KBAnalyticsRuleListResponse>(
      `/api/v1/projects/${projectId}/knowledge/analytics/rules`,
    );
  }

  /** Get a single analytics rule. */
  async getAnalyticsRule(
    projectId: string,
    ruleId: string,
  ): Promise<KBAnalyticsRule> {
    return this.http.get<KBAnalyticsRule>(
      `/api/v1/projects/${projectId}/knowledge/analytics/rules/${ruleId}`,
    );
  }

  /** Update an analytics rule. */
  async updateAnalyticsRule(
    projectId: string,
    ruleId: string,
    options: UpdateAnalyticsRuleOptions,
  ): Promise<KBAnalyticsRule> {
    return this.http.put<KBAnalyticsRule>(
      `/api/v1/projects/${projectId}/knowledge/analytics/rules/${ruleId}`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Delete an analytics rule. */
  async deleteAnalyticsRule(projectId: string, ruleId: string): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${projectId}/knowledge/analytics/rules/${ruleId}`,
    );
  }

  /** Trigger a manual run of an analytics rule. */
  async runAnalyticsRule(projectId: string, ruleId: string): Promise<void> {
    await this.http.post(
      `/api/v1/projects/${projectId}/knowledge/analytics/rules/${ruleId}/run`,
      {},
    );
  }

  // -- Analytics Queries --

  /** Get recommendations for a source node. */
  async getRecommendations(
    projectId: string,
    ruleId: string,
    sourceId: string,
    limit?: number,
  ): Promise<KBRecommendationsResponse> {
    const params: Record<string, string> = {
      rule_id: ruleId,
      source_id: sourceId,
    };
    if (limit) params.limit = String(limit);
    return this.http.get<KBRecommendationsResponse>(
      `/api/v1/projects/${projectId}/knowledge/analytics/recommendations`,
      params,
    );
  }

  /** Get trend aggregations for a node. */
  async getTrends(
    projectId: string,
    nodeId: string,
  ): Promise<KBTrendsResponse> {
    return this.http.get<KBTrendsResponse>(
      `/api/v1/projects/${projectId}/knowledge/analytics/trends`,
      { node_id: nodeId },
    );
  }

  /** Get trend rankings. */
  async getTrendRankings(
    projectId: string,
    ruleId: string,
    type: string,
    window: string,
    limit?: number,
  ): Promise<KBTrendRankingsResponse> {
    const params: Record<string, string> = {
      rule_id: ruleId,
      type,
      window,
    };
    if (limit) params.limit = String(limit);
    return this.http.get<KBTrendRankingsResponse>(
      `/api/v1/projects/${projectId}/knowledge/analytics/rankings`,
      params,
    );
  }

  /** Get conversion statistics. */
  async getConversions(
    projectId: string,
    ruleId: string,
    segment?: string,
  ): Promise<KBConversionsResponse> {
    const params: Record<string, string> = { rule_id: ruleId };
    if (segment) params.segment = segment;
    return this.http.get<KBConversionsResponse>(
      `/api/v1/projects/${projectId}/knowledge/analytics/conversions`,
      params,
    );
  }

  /** Record recommendation feedback. */
  async recordFeedback(
    projectId: string,
    options: RecordFeedbackOptions,
  ): Promise<void> {
    await this.http.post(
      `/api/v1/projects/${projectId}/knowledge/analytics/feedback`,
      options as unknown as Record<string, unknown>,
    );
  }

  // -- Bulk Update --

  /**
   * Batch-update KB node properties. Merges properties into existing nodes
   * matched by label + entity_type. Creates nodes that don't exist yet.
   * Sync for <=100 items; async via NATS for larger batches.
   */
  async bulkUpdate(
    projectId: string,
    options: KBBulkUpdateOptions,
  ): Promise<KBBulkUpdateResponse> {
    return this.http.patch<KBBulkUpdateResponse>(
      `/api/v1/projects/${projectId}/knowledge/bulk-update`,
      options as unknown as Record<string, unknown>,
    );
  }

  // -- Organization-global scope (docs/ORGANIZATION_GLOBAL_KB.md) --

  /**
   * Create a knowledge-base node directly in the organization-global scope.
   * Readable by every project under the tenant when its agents opt into
   * cascade / union / org_only scope modes. Idempotency is the caller's
   * responsibility — look up by label before calling this if duplicates
   * are a concern.
   */
  async createOrgNode(
    tenantId: string,
    options: CreateOrgNodeOptions,
  ): Promise<KBNode> {
    return this.http.post<KBNode>(
      `/api/v1/tenants/${tenantId}/knowledge/org-nodes`,
      options as unknown as Record<string, unknown>,
    );
  }

  /**
   * Promote a project-scoped node into the organization-global scope. The
   * project copy is preserved — promotion is additive. If an org node with
   * the same (node_type, norm_label) already exists, the server returns
   * that one instead of writing a duplicate.
   */
  async promoteNodeToOrg(
    projectId: string,
    nodeId: string,
    tenantId: string,
  ): Promise<KBNodeWithScope> {
    return this.http.post<KBNodeWithScope>(
      `/api/v1/projects/${projectId}/knowledge/nodes/${nodeId}/promote-to-org`,
      { tenant_id: tenantId },
    );
  }
}

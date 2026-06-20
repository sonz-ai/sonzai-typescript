import type { HTTPClient } from "../http.js";
import type {
	CompareRequest,
	CreateAnalyticsRuleOptions,
	CreateMultimodalSchemaOptions,
	CreateOrgNodeOptions,
	CreateSchemaOptions,
	InsertFactsOptions,
	InsertFactsResponse,
	KBAnalyticsRule,
	KBAnalyticsRuleListResponse,
	KBBulkUpdateOptions,
	KBBulkUpdateResponse,
	KBCompareResponse,
	KBConversionsResponse,
	KBDocCostResponse,
	KBDocument,
	KBDocumentListResponse,
	KBEntityRef,
	KBEntitySchema,
	KBFact,
	KBFactHistoryResponse,
	KBFactListResponse,
	KBGetEntityResponse,
	KBMultimodalSchemaActivateResponse,
	KBMultimodalSchemaCreateResponse,
	KBMultimodalSchemaListResponse,
	KBNode,
	KBNodeDetailResponse,
	KBNodeHistoryResponse,
	KBNodeListResponse,
	KBNodeWithScope,
	KBRecommendationsResponse,
	KBSchemaListResponse,
	KBSearchOptions,
	KBSearchResponse,
	KBStats,
	KBTraverseResponse,
	KBTrendRankingsResponse,
	KBTrendsResponse,
	ListFactsOptions,
	PatchClassificationRequest,
	PatchClassificationResponse,
	RecordFeedbackOptions,
	ReingestResponse,
	TraverseOptions,
	UpdateAnalyticsRuleOptions,
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

	// -- Agent-scoped writes (mirror knowledge_create / knowledge_update / knowledge_delete tools) --

	/**
	 * Create a KB node on behalf of an agent. The agent ID is stamped onto every
	 * `PropertySource.source` as `agent:<agentId>` so the audit trail records
	 * which agent made the write. Mirrors the `knowledge_create` agent tool —
	 * useful when a tenant backend wants to replay or audit-test what the agent
	 * would issue mid-conversation.
	 *
	 * Requires the agent to have `knowledgeBase: true` and either
	 * `knowledgeBaseWrite: true` or the project's `default_agent_kb_write` set
	 * to true.
	 */
	async agentCreateNode(
		projectId: string,
		agentId: string,
		request: {
			node_type: string;
			label: string;
			properties: Record<string, unknown>;
			confidence?: number;
		},
	): Promise<{ node: KBNodeDetailResponse["node"] }> {
		return this.http.post(
			`/api/v1/projects/${projectId}/knowledge/nodes`,
			request as unknown as Record<string, unknown>,
			undefined,
			{ "X-Agent-Id": agentId },
		);
	}

	/**
	 * Patch an existing KB node on behalf of an agent. Only the fields you set
	 * are merged; everything else is left as-is. Same auth requirements as
	 * agentCreateNode.
	 */
	async agentUpdateNode(
		projectId: string,
		nodeId: string,
		agentId: string,
		request: {
			properties?: Record<string, unknown>;
			label?: string;
			confidence?: number;
		},
	): Promise<{ node: KBNodeDetailResponse["node"] }> {
		return this.http.patch(
			`/api/v1/projects/${projectId}/knowledge/nodes/${nodeId}`,
			request as unknown as Record<string, unknown>,
			{ "X-Agent-Id": agentId },
		);
	}

	/**
	 * Soft-delete a KB node on behalf of an agent. Distinct from `deleteNode` —
	 * the agent variant goes through `/agent-delete`, stamps the audit trail
	 * with `agent:<agentId>`, and is the destination the `knowledge_delete`
	 * tool issues from the LLM side.
	 */
	async agentDeleteNode(
		projectId: string,
		nodeId: string,
		agentId: string,
	): Promise<{ success: boolean }> {
		return this.http.post(
			`/api/v1/projects/${projectId}/knowledge/nodes/${nodeId}/agent-delete`,
			undefined,
			undefined,
			{ "X-Agent-Id": agentId },
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

	// -- Multimodal documents (classification / reingest / cost) --

	/**
	 * Resolve a document parked in `needs_classification` by recording the
	 * human-confirmed root entity, which triggers Pass B extraction. Mirrors the
	 * Go SDK's `PatchDocumentClassification`.
	 */
	async patchDocumentClassification(
		projectId: string,
		documentId: string,
		body: PatchClassificationRequest,
	): Promise<PatchClassificationResponse> {
		return this.http.patch<PatchClassificationResponse>(
			`/api/v1/projects/${projectId}/knowledge/documents/${documentId}/classification`,
			body as unknown as Record<string, unknown>,
		);
	}

	/** Re-ingest a previously uploaded document (re-runs the extraction pipeline). */
	async reingestDocument(
		projectId: string,
		documentId: string,
	): Promise<ReingestResponse> {
		return this.http.post<ReingestResponse>(
			`/api/v1/projects/${projectId}/knowledge/documents/${documentId}/reingest`,
		);
	}

	/** Per-document billed cost breakdown (Document AI + LLM rows). */
	async getDocumentCost(
		projectId: string,
		documentId: string,
	): Promise<KBDocCostResponse> {
		return this.http.get<KBDocCostResponse>(
			`/api/v1/projects/${projectId}/knowledge/documents/${documentId}/cost`,
		);
	}

	// -- Multimodal facts (provenance-carrying relationship instances) --

	/** List active KB facts for a project (paginated). */
	async listFacts(
		projectId: string,
		options: ListFactsOptions = {},
	): Promise<KBFactListResponse> {
		const params: Record<string, string> = {};
		if (options.limit) params.limit = String(options.limit);
		if (options.pageToken) params.page_token = options.pageToken;
		return this.http.get<KBFactListResponse>(
			`/api/v1/projects/${projectId}/knowledge/facts`,
			params,
		);
	}

	/**
	 * Get the active KB fact for a (from, to, relation) tuple, or `null` when no
	 * active fact exists.
	 */
	async getActiveFact(
		projectId: string,
		fromNodeId: string,
		toNodeId: string,
		relationType: string,
	): Promise<KBFact | null> {
		const res = await this.http.get<{ fact: KBFact | null }>(
			`/api/v1/projects/${projectId}/knowledge/facts/active`,
			{
				from_node_id: fromNodeId,
				to_node_id: toNodeId,
				relation_type: relationType,
			},
		);
		return res.fact ?? null;
	}

	/** Get the version chain for a (from, to, relation) fact tuple. */
	async getFactHistory(
		projectId: string,
		fromNodeId: string,
		toNodeId: string,
		relationType: string,
	): Promise<KBFactHistoryResponse> {
		return this.http.get<KBFactHistoryResponse>(
			`/api/v1/projects/${projectId}/knowledge/facts/history`,
			{
				from_node_id: fromNodeId,
				to_node_id: toNodeId,
				relation_type: relationType,
			},
		);
	}

	// -- 4-tool retrieval surface (kb_get_entity / kb_traverse / kb_compare) --

	/**
	 * Look up an entity by (type, key) and return all active facts attached to
	 * it. The entity key is JSON-encoded into the path segment, mirroring the Go
	 * SDK's `GetEntity`.
	 */
	async getEntity(
		projectId: string,
		entityType: string,
		entityKey: Record<string, unknown>,
	): Promise<KBGetEntityResponse> {
		const keyJSON = JSON.stringify(entityKey);
		return this.http.get<KBGetEntityResponse>(
			`/api/v1/projects/${projectId}/knowledge/entities/${encodeURIComponent(
				entityType,
			)}/${encodeURIComponent(keyJSON)}`,
		);
	}

	/**
	 * Walk the graph from a starting entity along `relationType` up to
	 * `maxDepth`. The starting entity's key is JSON-encoded into the `from_key`
	 * query parameter.
	 */
	async traverse(
		projectId: string,
		from: KBEntityRef,
		relationType: string,
		options: TraverseOptions = {},
	): Promise<KBTraverseResponse> {
		const params: Record<string, string> = {
			from_type: from.type,
			from_key: JSON.stringify(from.key),
			relation_type: relationType,
		};
		if (options.direction) params.direction = options.direction;
		if (options.maxDepth) params.max_depth = String(options.maxDepth);
		return this.http.get<KBTraverseResponse>(
			`/api/v1/projects/${projectId}/knowledge/traverse`,
			params,
		);
	}

	/**
	 * Compare a property value across multiple entities connected to a shared
	 * target via the same relation.
	 */
	async compare(
		projectId: string,
		request: CompareRequest,
	): Promise<KBCompareResponse> {
		return this.http.post<KBCompareResponse>(
			`/api/v1/projects/${projectId}/knowledge/compare`,
			request as unknown as Record<string, unknown>,
		);
	}

	// -- Multimodal schemas --

	/** List multimodal KB schema versions for a project. */
	async listMultimodalSchemas(
		projectId: string,
	): Promise<KBMultimodalSchemaListResponse> {
		return this.http.get<KBMultimodalSchemaListResponse>(
			`/api/v1/projects/${projectId}/knowledge/multimodal-schemas`,
		);
	}

	/** Create a new multimodal KB schema version (created as a draft). */
	async createMultimodalSchema(
		projectId: string,
		options: CreateMultimodalSchemaOptions,
	): Promise<KBMultimodalSchemaCreateResponse> {
		return this.http.post<KBMultimodalSchemaCreateResponse>(
			`/api/v1/projects/${projectId}/knowledge/multimodal-schemas`,
			options as unknown as Record<string, unknown>,
		);
	}

	/** Activate a draft multimodal schema version. */
	async activateMultimodalSchema(
		projectId: string,
		version: number,
	): Promise<KBMultimodalSchemaActivateResponse> {
		return this.http.post<KBMultimodalSchemaActivateResponse>(
			`/api/v1/projects/${projectId}/knowledge/multimodal-schemas/${version}/activate`,
		);
	}
}

import type { HTTPClient } from "../http.js";
import type {
  InventoryUpdateOptions,
  InventoryUpdateResponse,
  InventoryQueryOptions,
  InventoryQueryResponse,
  InventoryBatchImportOptions,
  InventoryBatchImportResponse,
  InventoryDirectUpdateOptions,
  InventoryDirectUpdateResponse,
  ListAllFactsOptions,
  ListAllFactsResponse,
} from "../types.js";

/** Inventory/asset tracking operations scoped to an agent + user. */
export class Inventory {
  constructor(private readonly http: HTTPClient) {}

  /**
   * Add, update, or remove an inventory item (agent tool flow).
   * When action is "add" and the KB description is ambiguous, returns
   * `status: "disambiguation_needed"` with candidate KB nodes.
   */
  async update(
    agentId: string,
    userId: string,
    options: InventoryUpdateOptions,
    instanceId?: string,
  ): Promise<InventoryUpdateResponse> {
    const params = instanceId ? { instance_id: instanceId } : undefined;
    return this.http.post<InventoryUpdateResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/inventory`,
      options as unknown as Record<string, unknown>,
      params,
    );
  }

  /**
   * Query a user's inventory with optional KB-joined valuations and aggregation.
   * Modes: "list" (items only), "value" (items + market prices), "aggregate" (totals).
   */
  async query(
    agentId: string,
    userId: string,
    options: InventoryQueryOptions = {},
  ): Promise<InventoryQueryResponse> {
    const params: Record<string, string> = {};
    if (options.mode) params.mode = options.mode;
    if (options.item_type) params.item_type = options.item_type;
    if (options.query) params.query = options.query;
    if (options.project_id) params.project_id = options.project_id;
    if (options.aggregations) params.aggregations = options.aggregations;
    if (options.group_by) params.group_by = options.group_by;
    if (options.limit) params.limit = String(options.limit);
    if (options.instanceId) params.instance_id = options.instanceId;

    return this.http.get<InventoryQueryResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/inventory`,
      params,
    );
  }

  /**
   * Batch-import inventory items (developer API).
   * Up to 1000 items per request.
   */
  async batchImport(
    agentId: string,
    userId: string,
    options: InventoryBatchImportOptions,
    instanceId?: string,
  ): Promise<InventoryBatchImportResponse> {
    const params = instanceId ? { instance_id: instanceId } : undefined;
    return this.http.post<InventoryBatchImportResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/inventory/batch`,
      options as unknown as Record<string, unknown>,
      params,
    );
  }

  /**
   * Directly update an inventory fact's properties by fact ID (developer API).
   * Creates a superseding fact with merged properties.
   */
  async directUpdate(
    agentId: string,
    userId: string,
    factId: string,
    options: InventoryDirectUpdateOptions,
    instanceId?: string,
  ): Promise<InventoryDirectUpdateResponse> {
    let path = `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/inventory/${encodeURIComponent(factId)}`;
    if (instanceId) path += `?instance_id=${encodeURIComponent(instanceId)}`;
    return this.http.put<InventoryDirectUpdateResponse>(
      path,
      options as unknown as Record<string, unknown>,
    );
  }

  /**
   * Directly delete an inventory item by fact ID (developer API).
   * Creates a superseding fact with `removed: true`.
   */
  async directDelete(
    agentId: string,
    userId: string,
    factId: string,
    instanceId?: string,
  ): Promise<InventoryDirectUpdateResponse> {
    const params = instanceId ? { instance_id: instanceId } : undefined;
    return this.http.delete<InventoryDirectUpdateResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/inventory/${encodeURIComponent(factId)}`,
      params,
    );
  }

  /**
   * List all active facts for an agent+user pair.
   * Supports filtering by metadata presence and item_type.
   * Bypasses the token-budgeted predictor — returns up to `limit` facts.
   */
  async listAllFacts(
    agentId: string,
    userId: string,
    options: ListAllFactsOptions = {},
  ): Promise<ListAllFactsResponse> {
    const params: Record<string, string> = {};
    if (options.has_metadata) params.has_metadata = "true";
    if (options.item_type) params["metadata.item_type"] = options.item_type;
    if (options.limit) params.limit = String(options.limit);
    if (options.instanceId) params.instance_id = options.instanceId;

    return this.http.get<ListAllFactsResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/facts`,
      params,
    );
  }
}

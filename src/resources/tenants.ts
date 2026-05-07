import type { HTTPClient } from "../http.js";
import type {
  KbListOrgNodesOutputBody,
  Tenant,
} from "../generated/flat-exports.js";

export interface ListOrgKnowledgeNodesOptions {
  nodeType?: string;
  limit?: number;
}

/**
 * Tenants — multi-tenant lookup and tenant-scoped organization knowledge.
 *
 * Wraps `/api/v1/tenants/...`. Most app developers won't need this; it's
 * primarily for admin tools that need to enumerate tenants the caller has
 * access to or read tenant-global knowledge nodes.
 */
export class Tenants {
  constructor(private readonly http: HTTPClient) {}

  /** List tenants the caller has access to. */
  async list(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/tenants");
  }

  /** Read a single tenant by ID. */
  async get(tenantId: string): Promise<Tenant> {
    return this.http.get<Tenant>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}`,
    );
  }

  /** List nodes in the tenant's organization-global knowledge graph. */
  async listOrgKnowledgeNodes(
    tenantId: string,
    options: ListOrgKnowledgeNodesOptions = {},
  ): Promise<KbListOrgNodesOutputBody> {
    return this.http.get<KbListOrgNodesOutputBody>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/knowledge/org-nodes`,
      {
        node_type: options.nodeType,
        limit: options.limit,
      },
    );
  }
}

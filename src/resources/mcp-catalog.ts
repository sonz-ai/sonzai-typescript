import type { HTTPClient } from "../http.js";
import type {
  ListMCPCatalogOutputBody,
  MCPCatalogCreateBody,
  MCPCatalogEntry,
  MCPCatalogToolsResponse,
  MCPCatalogUpdateBody,
  MCPCatalogUsagesResponse,
  MCPProbeResponseBody,
} from "../types.js";

/**
 * MCP Catalog — per-project registry of MCP (Model Context Protocol)
 * server endpoints. Each entry pairs a remote MCP URL with auth config;
 * agents opt into specific entries via the `mcpEnabled` capability (a
 * list of catalog IDs). At chat time, the platform discovers each
 * entry's tools and registers them as agent-callable tools.
 *
 * Org-admin only on writes (create / update / delete); reads are open
 * within the project.
 */
export class MCPCatalog {
  constructor(private readonly http: HTTPClient) {}

  /** List every catalog entry registered for the project. */
  async list(projectId: string): Promise<ListMCPCatalogOutputBody> {
    return this.http.get<ListMCPCatalogOutputBody>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog`,
    );
  }

  /** Get a single catalog entry by ID. */
  async get(projectId: string, id: string): Promise<MCPCatalogEntry> {
    return this.http.get<MCPCatalogEntry>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/${encodeURIComponent(id)}`,
    );
  }

  /** Register a new MCP server with the project's catalog. Org-admin only. */
  async create(
    projectId: string,
    body: MCPCatalogCreateBody,
  ): Promise<MCPCatalogEntry> {
    return this.http.post<MCPCatalogEntry>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog`,
      body as unknown as Record<string, unknown>,
    );
  }

  /**
   * Patch an existing catalog entry. Auth is updated atomically — pass a
   * fresh `auth` object to rotate credentials. Org-admin only.
   */
  async update(
    projectId: string,
    id: string,
    body: MCPCatalogUpdateBody,
  ): Promise<MCPCatalogEntry> {
    return this.http.patch<MCPCatalogEntry>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/${encodeURIComponent(id)}`,
      body as unknown as Record<string, unknown>,
    );
  }

  /**
   * Delete a catalog entry. Agents that had this ID in their `mcpEnabled`
   * capability lose access immediately; their `mcpEnabled` list is left
   * unchanged (the platform tolerates dangling IDs and skips them at
   * tool-decl time). Org-admin only.
   */
  async delete(projectId: string, id: string): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/${encodeURIComponent(id)}`,
    );
  }

  /**
   * Synchronously contact the MCP server described by `body` *without
   * persisting anything*. Use this from a "Test connection" button before
   * saving. The response includes latency, tool count, and any
   * auth/transport error the platform observed.
   */
  async probeConfig(
    projectId: string,
    body: MCPCatalogCreateBody,
  ): Promise<MCPProbeResponseBody> {
    return this.http.post<MCPProbeResponseBody>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/probe`,
      body as unknown as Record<string, unknown>,
    );
  }

  /**
   * Re-contact an existing catalog entry's MCP server and refresh its
   * tool list + health summary. Useful after the upstream MCP deployment
   * has changed (added/removed tools, rotated auth) without waiting for
   * the platform's background refresh.
   */
  async probe(projectId: string, id: string): Promise<MCPProbeResponseBody> {
    return this.http.post<MCPProbeResponseBody>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/${encodeURIComponent(id)}/probe`,
    );
  }

  /**
   * List the tools advertised by this entry's MCP server, as captured the
   * last time the platform probed it. Useful for dashboard pickers that
   * show "which tools does this MCP expose?".
   */
  async listTools(
    projectId: string,
    id: string,
  ): Promise<MCPCatalogToolsResponse> {
    return this.http.get<MCPCatalogToolsResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/${encodeURIComponent(id)}/tools`,
    );
  }

  /**
   * List every agent ID currently opted into this catalog entry via its
   * `mcpEnabled` capability. Useful for "who would I break if I delete
   * this entry?" diligence before removing it.
   */
  async listUsages(
    projectId: string,
    id: string,
  ): Promise<MCPCatalogUsagesResponse> {
    return this.http.get<MCPCatalogUsagesResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/mcp/catalog/${encodeURIComponent(id)}/usages`,
    );
  }
}

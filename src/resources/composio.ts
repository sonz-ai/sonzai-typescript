import type { HTTPClient } from "../http.js";
import type {
  ComposioConnectCallbackInputBody,
  ComposioConnectCallbackOutputBody,
  InitiateComposioConnectInputBody,
  InitiateComposioConnectOutputBody,
  ListComposioAuditOutputBody,
  ListComposioAvailableActionsOutputBody,
  ListComposioConnectionsOutputBody,
} from "../types.js";

/**
 * Composio — per-agent connected SaaS accounts (Gmail, Calendar, Slack,
 * GitHub, Linear, Notion, Drive). Gated on the `Composio` agent
 * capability. When the deployment has no `COMPOSIO_API_KEY` configured
 * every endpoint returns 503; the SDK surface stays stable so callers
 * can detect "not configured" without a spec drift.
 */
export class Composio {
  constructor(private readonly http: HTTPClient) {}

  /** List the agent's connected Composio accounts. */
  async listConnections(
    agentId: string,
  ): Promise<ListComposioConnectionsOutputBody> {
    return this.http.get<ListComposioConnectionsOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/composio/connections`,
    );
  }

  /**
   * Initiate an OAuth flow. Returns the redirect URL the end user must
   * visit plus the pending `connected_account_id`. Pass that id back via
   * `connectCallback` after the user completes the flow.
   */
  async initiateConnect(
    agentId: string,
    body: InitiateComposioConnectInputBody,
  ): Promise<InitiateComposioConnectOutputBody> {
    return this.http.post<InitiateComposioConnectOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/composio/connections`,
      body,
    );
  }

  /** Persist a connection after the end user finishes the OAuth flow. */
  async connectCallback(
    agentId: string,
    body: ComposioConnectCallbackInputBody,
  ): Promise<ComposioConnectCallbackOutputBody> {
    return this.http.post<ComposioConnectCallbackOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/composio/connections/callback`,
      body,
    );
  }

  /**
   * Revoke a connection for (agent, app). Revokes the upstream Composio
   * account first, then removes the local row. Idempotent against
   * already-missing rows.
   */
  async deleteConnection(agentId: string, app: string): Promise<void> {
    await this.http.delete(
      `/api/v1/agents/${encodeURIComponent(agentId)}/composio/connections/${encodeURIComponent(app)}`,
    );
  }

  /**
   * Read the agent's redacted Composio action log. Supports RFC3339
   * `from`/`to` (defaults to the last 24h), status filter
   * (`ok`/`error`/`rate_limited`), and a limit (default 100, max 500).
   */
  async listAudit(
    agentId: string,
    params: {
      from?: string;
      to?: string;
      status?: "ok" | "error" | "rate_limited";
      limit?: number;
    } = {},
  ): Promise<ListComposioAuditOutputBody> {
    const q: Record<string, string | number> = {};
    if (params.from) q.from = params.from;
    if (params.to) q.to = params.to;
    if (params.status) q.status = params.status;
    if (params.limit !== undefined) q.limit = params.limit;
    return this.http.get<ListComposioAuditOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/composio/audit`,
      q,
    );
  }

  /**
   * List the curated actions available to the agent across its
   * connected apps. The dashboard renders this as "Gmail — 4 enabled
   * actions"; the LLM receives a subset as declared tools during chat.
   */
  async listAvailableActions(
    agentId: string,
  ): Promise<ListComposioAvailableActionsOutputBody> {
    return this.http.get<ListComposioAvailableActionsOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/composio/available_actions`,
    );
  }
}

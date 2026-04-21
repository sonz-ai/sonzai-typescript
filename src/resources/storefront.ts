import type { HTTPClient } from "../http.js";
import type {
  StorefrontUpdateOptions,
  StorefrontUpsertAgentOptions,
} from "../types.js";

/**
 * Storefront operations (public agent marketplace).
 *
 * One storefront per tenant with zero-or-more agents attached. Typically
 * consumed by an admin UI that lets tenants publish their agents.
 */
export class Storefront {
  constructor(private readonly http: HTTPClient) {}

  /** Get the storefront config for the current tenant. */
  get(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>("/api/v1/storefront");
  }

  /** Update storefront config. Only the provided fields are sent. */
  update(options: StorefrontUpdateOptions): Promise<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(
      "/api/v1/storefront",
      options as unknown as Record<string, unknown>,
    );
  }

  /** Publish the storefront. */
  publish(): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/storefront/publish", {});
  }

  /** Unpublish the storefront. */
  unpublish(): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/storefront/unpublish", {});
  }

  /** List agents attached to the storefront. */
  listAgents(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>("/api/v1/storefront/agents");
  }

  /** Add or update an agent on the storefront. */
  upsertAgent(
    agentId: string,
    options: StorefrontUpsertAgentOptions,
  ): Promise<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(
      `/api/v1/storefront/agents/${encodeURIComponent(agentId)}`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Remove an agent from the storefront. */
  removeAgent(agentId: string): Promise<Record<string, unknown>> {
    return this.http.delete<Record<string, unknown>>(
      `/api/v1/storefront/agents/${encodeURIComponent(agentId)}`,
    );
  }
}

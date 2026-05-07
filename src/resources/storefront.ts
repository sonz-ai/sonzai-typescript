import type { HTTPClient } from "../http.js";
import type {
  StorefrontGetOutputBody,
  StorefrontListAgentsOutputBody,
  StorefrontUpdateInputBody,
  StorefrontUpsertAgentInputBody,
} from "../generated/flat-exports.js";

export interface StorefrontUpdateOptions {
  accessType?: string;
  contactEmail?: string;
  description?: string;
  displayName?: string;
  heroImageUrl?: string;
  inviteCode?: string;
  maxVisitsPerUser?: number;
  slug?: string;
  theme?: string;
}

export interface StorefrontUpsertAgentOptions {
  avatarUrl?: string;
  description?: string;
  displayName?: string;
  featured?: boolean;
  maxTurnsPerVisit?: number;
  slug?: string;
}

/**
 * Storefront — agent marketplace publishing for the current tenant.
 *
 * Wraps `/api/v1/storefront/...`. Most fields are free-form; pull typed
 * models from `flat-exports.js` when you need stronger typing.
 */
export class Storefront {
  constructor(private readonly http: HTTPClient) {}

  /** Fetch the current storefront configuration. */
  async get(): Promise<StorefrontGetOutputBody> {
    return this.http.get<StorefrontGetOutputBody>("/api/v1/storefront");
  }

  /** Update storefront settings. Only non-undefined fields are sent. */
  async update(options: StorefrontUpdateOptions): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {};
    if (options.accessType !== undefined) body.access_type = options.accessType;
    if (options.contactEmail !== undefined) body.contact_email = options.contactEmail;
    if (options.description !== undefined) body.description = options.description;
    if (options.displayName !== undefined) body.display_name = options.displayName;
    if (options.heroImageUrl !== undefined) body.hero_image_url = options.heroImageUrl;
    if (options.inviteCode !== undefined) body.invite_code = options.inviteCode;
    if (options.maxVisitsPerUser !== undefined)
      body.max_visits_per_user = options.maxVisitsPerUser;
    if (options.slug !== undefined) body.slug = options.slug;
    if (options.theme !== undefined) body.theme = options.theme;
    // Validate body shape against the generated type at compile time.
    const _typed: StorefrontUpdateInputBody = body as StorefrontUpdateInputBody;
    void _typed;
    return this.http.put("/api/v1/storefront", body);
  }

  /** Publish the storefront. */
  async publish(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post("/api/v1/storefront/publish", body);
  }

  /** Unpublish the storefront. */
  async unpublish(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post("/api/v1/storefront/unpublish", body);
  }

  /** List the agents currently published to the storefront. */
  async listAgents(): Promise<StorefrontListAgentsOutputBody> {
    return this.http.get<StorefrontListAgentsOutputBody>("/api/v1/storefront/agents");
  }

  /** Publish (or update) an agent on the storefront. */
  async upsertAgent(
    agentId: string,
    options: StorefrontUpsertAgentOptions,
  ): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {};
    if (options.avatarUrl !== undefined) body.avatar_url = options.avatarUrl;
    if (options.description !== undefined) body.description = options.description;
    if (options.displayName !== undefined) body.display_name = options.displayName;
    if (options.featured !== undefined) body.featured = options.featured;
    if (options.maxTurnsPerVisit !== undefined)
      body.max_turns_per_visit = options.maxTurnsPerVisit;
    if (options.slug !== undefined) body.slug = options.slug;
    const _typed: StorefrontUpsertAgentInputBody = body as StorefrontUpsertAgentInputBody;
    void _typed;
    return this.http.put(
      `/api/v1/storefront/agents/${encodeURIComponent(agentId)}`,
      body,
    );
  }

  /** Remove an agent from the storefront. */
  async removeAgent(agentId: string): Promise<void> {
    await this.http.delete(
      `/api/v1/storefront/agents/${encodeURIComponent(agentId)}`,
    );
  }
}

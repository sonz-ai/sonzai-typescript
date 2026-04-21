import type { HTTPClient } from "../http.js";
import type { Tenant } from "../types.js";

/** Tenant listing (platform-admin scope). */
export class Tenants {
  constructor(private readonly http: HTTPClient) {}

  /** List all tenants the caller can see. */
  async list(): Promise<Tenant[]> {
    const data = await this.http.get<Tenant[] | null>("/api/v1/tenants");
    return data ?? [];
  }

  /** Get a tenant by ID. */
  get(tenantId: string): Promise<Tenant> {
    return this.http.get<Tenant>(`/api/v1/tenants/${tenantId}`);
  }
}

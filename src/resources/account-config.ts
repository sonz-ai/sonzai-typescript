import type { HTTPClient } from "../http.js";
import type {
  AccountConfigEntry,
  AccountConfigListResponse,
  PostProcessingModelMap,
} from "../types.js";
import {
  POST_PROCESSING_MODEL_MAP_KEY,
  decodePostProcessingMap,
} from "../post-processing-model.js";

/**
 * Tenant-scoped ("account-level") configuration (key-value store).
 *
 * The tenant is resolved from the API key or Clerk session on the server —
 * never from a URL parameter — so callers can only read or write config for
 * the tenant they are currently authenticated to.
 *
 * Use for settings that should apply to every project inside the tenant
 * without per-project duplication: for example, the default post-processing
 * model map (see `POST_PROCESSING_MODEL_MAP_KEY`).
 */
export class AccountConfig {
  constructor(private readonly http: HTTPClient) {}

  /** List all config entries for the authenticated tenant. */
  async list(): Promise<AccountConfigListResponse> {
    return this.http.get<AccountConfigListResponse>(`/api/v1/account/config`);
  }

  /** Get a config value by key. */
  async get(key: string): Promise<AccountConfigEntry> {
    return this.http.get<AccountConfigEntry>(
      `/api/v1/account/config/${key}`,
    );
  }

  /** Set a config value. Body must be valid JSON. */
  async set(key: string, value: unknown): Promise<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `/api/v1/account/config/${key}`,
      value as Record<string, unknown>,
    );
  }

  /** Delete a config entry. */
  async delete(key: string): Promise<void> {
    await this.http.delete(`/api/v1/account/config/${key}`);
  }

  /**
   * Read the tenant-level post-processing model map.
   * Returns `null` when no map is configured for the tenant — callers can
   * then rely on the system-default layer.
   */
  async getPostProcessingModelMap(): Promise<PostProcessingModelMap | null> {
    const entry = await this.get(POST_PROCESSING_MODEL_MAP_KEY);
    return decodePostProcessingMap(entry.value);
  }

  /**
   * Write the tenant-level post-processing model map, replacing whatever
   * was stored before.
   */
  async setPostProcessingModelMap(
    map: PostProcessingModelMap,
  ): Promise<{ success: boolean }> {
    return this.set(POST_PROCESSING_MODEL_MAP_KEY, map);
  }

  /**
   * Remove the account-level map so the resolver cascade falls through to
   * the system defaults.
   */
  async deletePostProcessingModelMap(): Promise<void> {
    await this.delete(POST_PROCESSING_MODEL_MAP_KEY);
  }
}

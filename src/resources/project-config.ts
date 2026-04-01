import type { HTTPClient } from "../http.js";
import type {
  ProjectConfigEntry,
  ProjectConfigListResponse,
} from "../types.js";

/** Project-scoped configuration (key-value store). */
export class ProjectConfig {
  constructor(private readonly http: HTTPClient) {}

  /** List all config entries for a project. */
  async list(projectId: string): Promise<ProjectConfigListResponse> {
    return this.http.get<ProjectConfigListResponse>(
      `/api/v1/projects/${projectId}/config`,
    );
  }

  /** Get a config value by key. Returns the raw JSON value. */
  async get(projectId: string, key: string): Promise<ProjectConfigEntry> {
    return this.http.get<ProjectConfigEntry>(
      `/api/v1/projects/${projectId}/config/${key}`,
    );
  }

  /** Set a config value. Body must be valid JSON. */
  async set(
    projectId: string,
    key: string,
    value: unknown,
  ): Promise<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `/api/v1/projects/${projectId}/config/${key}`,
      value as Record<string, unknown>,
    );
  }

  /** Delete a config entry. */
  async delete(projectId: string, key: string): Promise<void> {
    await this.http.delete(`/api/v1/projects/${projectId}/config/${key}`);
  }
}

import type { HTTPClient } from "../http.js";
import type {
  PostProcessingModelMap,
  ProjectConfigEntry,
  ProjectConfigListResponse,
} from "../types.js";
import {
  POST_PROCESSING_MODEL_MAP_KEY,
  decodePostProcessingMap,
} from "../post-processing-model.js";

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

  /**
   * Read the project-level post-processing model map.
   * Returns `null` when no map is configured for the project — callers can
   * then rely on the account or system-default layer.
   */
  async getPostProcessingModelMap(
    projectId: string,
  ): Promise<PostProcessingModelMap | null> {
    const entry = await this.get(projectId, POST_PROCESSING_MODEL_MAP_KEY);
    return decodePostProcessingMap(entry.value);
  }

  /**
   * Write the project-level post-processing model map, replacing whatever
   * was stored before.
   */
  async setPostProcessingModelMap(
    projectId: string,
    map: PostProcessingModelMap,
  ): Promise<{ success: boolean }> {
    return this.set(projectId, POST_PROCESSING_MODEL_MAP_KEY, map);
  }

  /** Remove the project-level map so the cascade falls through. */
  async deletePostProcessingModelMap(projectId: string): Promise<void> {
    await this.delete(projectId, POST_PROCESSING_MODEL_MAP_KEY);
  }
}

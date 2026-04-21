import type { HTTPClient } from "../http.js";
import type {
  Project,
  ProjectListResponse,
  ProjectAPIKeyListResponse,
  CreateProjectOptions,
  UpdateProjectDetailsOptions,
  DeleteProjectResponse,
  CreateAPIKeyOptions,
  CreateAPIKeyResponse,
  RevokeAPIKeyResponse,
} from "../types.js";

export class Projects {
  constructor(private readonly http: HTTPClient) {}

  /** List all projects for the current tenant. */
  list(options: { limit?: number; offset?: number } = {}): Promise<ProjectListResponse> {
    return this.http.get<ProjectListResponse>("/api/v1/projects", {
      limit: options.limit,
      offset: options.offset,
    });
  }

  /** Create a new project. */
  create(options: CreateProjectOptions): Promise<Project> {
    const body: Record<string, unknown> = { name: options.name };
    if (options.environment) body.environment = options.environment;
    return this.http.post<Project>("/api/v1/projects", body);
  }

  /** Get a project by ID. */
  get(projectId: string): Promise<Project> {
    return this.http.get<Project>(`/api/v1/projects/${projectId}`);
  }

  /** Update a project. */
  update(projectId: string, options: UpdateProjectDetailsOptions): Promise<Project> {
    const body: Record<string, unknown> = {};
    if (options.name) body.name = options.name;
    if (options.gameName) body.game_name = options.gameName;
    if (options.environment) body.environment = options.environment;
    return this.http.put<Project>(`/api/v1/projects/${projectId}`, body);
  }

  /** Delete a project. */
  delete(projectId: string): Promise<DeleteProjectResponse> {
    return this.http.delete<DeleteProjectResponse>(`/api/v1/projects/${projectId}`);
  }

  // -- API Keys --

  /** List API keys for a project. */
  listKeys(projectId: string): Promise<ProjectAPIKeyListResponse> {
    return this.http.get<ProjectAPIKeyListResponse>(`/api/v1/projects/${projectId}/keys`);
  }

  /** Create a new API key. The plaintext key is returned only once. */
  createKey(projectId: string, options: CreateAPIKeyOptions = {}): Promise<CreateAPIKeyResponse> {
    const body: Record<string, unknown> = {};
    if (options.name) body.name = options.name;
    if (options.expiresDays != null) body.expires_days = options.expiresDays;
    if (options.scopes) body.scopes = options.scopes;
    return this.http.post<CreateAPIKeyResponse>(`/api/v1/projects/${projectId}/keys`, body);
  }

  /** Revoke an API key. */
  revokeKey(projectId: string, keyId: string): Promise<RevokeAPIKeyResponse> {
    return this.http.delete<RevokeAPIKeyResponse>(`/api/v1/projects/${projectId}/keys/${keyId}`);
  }
}

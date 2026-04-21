import type { HTTPClient } from "../http.js";
import type {
  PrimeUserOptions,
  PrimeUserResponse,
  AddContentOptions,
  AddContentResponse,
  UserPrimingMetadata,
  UpdateMetadataOptions,
  UpdateMetadataResponse,
  BatchImportOptions,
  BatchImportResponse,
  ImportJob,
  ImportJobListResponse,
  ListImportJobUsersResponse,
} from "../types.js";

/** User priming operations for agents. */
export class Priming {
  constructor(private readonly http: HTTPClient) {}

  /** Prime a user with metadata and content. Returns a job ID for async processing. */
  async primeUser(
    agentId: string,
    userId: string,
    options: PrimeUserOptions,
  ): Promise<PrimeUserResponse> {
    return this.http.post<PrimeUserResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/prime`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Get the status of a priming job. */
  async getPrimeStatus(
    agentId: string,
    userId: string,
    jobId: string,
  ): Promise<ImportJob> {
    return this.http.get<ImportJob>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/prime/${jobId}`,
    );
  }

  /** Add content blocks for async LLM extraction. */
  async addContent(
    agentId: string,
    userId: string,
    options: AddContentOptions,
  ): Promise<AddContentResponse> {
    return this.http.post<AddContentResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/content`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Get priming metadata for a user. */
  async getMetadata(
    agentId: string,
    userId: string,
  ): Promise<UserPrimingMetadata> {
    return this.http.get<UserPrimingMetadata>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/metadata`,
    );
  }

  /** Partially update priming metadata. */
  async updateMetadata(
    agentId: string,
    userId: string,
    options: UpdateMetadataOptions,
  ): Promise<UpdateMetadataResponse> {
    return this.http.patch<UpdateMetadataResponse>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/metadata`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Batch import multiple users with metadata and content. */
  async batchImport(
    agentId: string,
    options: BatchImportOptions,
  ): Promise<BatchImportResponse> {
    return this.http.post<BatchImportResponse>(
      `/api/v1/agents/${agentId}/users/import`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Get the status of a batch import job. */
  async getImportStatus(
    agentId: string,
    jobId: string,
  ): Promise<ImportJob> {
    return this.http.get<ImportJob>(
      `/api/v1/agents/${agentId}/users/import/${jobId}`,
    );
  }

  /** List recent import jobs for an agent. */
  async listImportJobs(
    agentId: string,
    limit?: number,
  ): Promise<ImportJobListResponse> {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    return this.http.get<ImportJobListResponse>(
      `/api/v1/agents/${agentId}/users/imports`,
      params,
    );
  }

  /** List per-user progress rows for a batch import job. */
  async listImportJobUsers(
    agentId: string,
    jobId: string,
    limit?: number,
  ): Promise<ListImportJobUsersResponse> {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    return this.http.get<ListImportJobUsersResponse>(
      `/api/v1/agents/${agentId}/users/import/${jobId}/users`,
      params,
    );
  }
}

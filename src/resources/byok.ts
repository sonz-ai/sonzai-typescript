import type { HTTPClient } from "../http.js";
import type { BYOKKeyResponse } from "../generated/flat-exports.js";

export type BYOKProvider = "openai" | "gemini" | "xai" | "openrouter";

/** Project-scoped BYOK (bring-your-own-key) provider configuration. */
export class BYOK {
  constructor(private readonly http: HTTPClient) {}

  /** List all BYOK keys configured for a project. */
  async list(projectId: string): Promise<BYOKKeyResponse[]> {
    const data = await this.http.get<{ keys: BYOKKeyResponse[] | null }>(
      `/api/v1/projects/${projectId}/byok-keys`,
    );
    return data.keys ?? [];
  }

  /** Set or replace the BYOK key for a provider. */
  async set(
    projectId: string,
    provider: BYOKProvider,
    apiKey: string,
  ): Promise<BYOKKeyResponse> {
    return this.http.put<BYOKKeyResponse>(
      `/api/v1/projects/${projectId}/byok-keys/${provider}`,
      { api_key: apiKey },
    );
  }

  /** Delete the BYOK key for a provider. */
  async delete(projectId: string, provider: BYOKProvider): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${projectId}/byok-keys/${provider}`,
    );
  }

  /** Enable or disable a BYOK key without rotating it. */
  async setActive(
    projectId: string,
    provider: BYOKProvider,
    isActive: boolean,
  ): Promise<BYOKKeyResponse> {
    return this.http.patch<BYOKKeyResponse>(
      `/api/v1/projects/${projectId}/byok-keys/${provider}`,
      { is_active: isActive },
    );
  }

  /** Re-test a stored BYOK key against the provider. */
  async test(
    projectId: string,
    provider: BYOKProvider,
  ): Promise<BYOKKeyResponse> {
    return this.http.post<BYOKKeyResponse>(
      `/api/v1/projects/${projectId}/byok-keys/${provider}/test`,
      {},
    );
  }
}

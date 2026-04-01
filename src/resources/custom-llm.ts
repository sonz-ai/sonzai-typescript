import type { HTTPClient } from "../http.js";
import type {
  CustomLLMConfigResponse,
  SetCustomLLMOptions,
} from "../types.js";

/** Project-scoped custom LLM provider configuration. */
export class CustomLLM {
  constructor(private readonly http: HTTPClient) {}

  /** Get the custom LLM config for a project. */
  async get(projectId: string): Promise<CustomLLMConfigResponse> {
    return this.http.get<CustomLLMConfigResponse>(
      `/api/v1/projects/${projectId}/custom-llm`,
    );
  }

  /** Set or update the custom LLM config. */
  async set(
    projectId: string,
    options: SetCustomLLMOptions,
  ): Promise<CustomLLMConfigResponse> {
    return this.http.put<CustomLLMConfigResponse>(
      `/api/v1/projects/${projectId}/custom-llm`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Delete the custom LLM config. */
  async delete(projectId: string): Promise<void> {
    await this.http.delete(`/api/v1/projects/${projectId}/custom-llm`);
  }
}

import type { HTTPClient } from "../http.js";
import type {
  Pipeline,
  PipelineInput,
  PipelineListResponse,
  PipelineRun,
  PipelineStep,
} from "../types.js";

/**
 * Pipeline runs chain multiple agent steps and can take minutes, so the
 * SDK applies a generous 10-minute deadline to {@link Pipelines.run}
 * instead of the client-level default.
 */
const PIPELINE_RUN_TIMEOUT_MS = 600_000;

/** Project-scoped pipeline management and execution operations. */
export class Pipelines {
  constructor(private readonly http: HTTPClient) {}

  /** List all pipelines for the current project. */
  async list(): Promise<PipelineListResponse> {
    return this.http.get<PipelineListResponse>("/api/v1/pipelines");
  }

  /** Create a new pipeline. */
  async create(input: PipelineInput): Promise<Pipeline> {
    return this.http.post<Pipeline>(
      "/api/v1/pipelines",
      input as unknown as Record<string, unknown>,
    );
  }

  /** Get a single pipeline by id. */
  async get(pipelineId: string): Promise<Pipeline> {
    return this.http.get<Pipeline>(`/api/v1/pipelines/${pipelineId}`);
  }

  /** Update an existing pipeline. */
  async update(pipelineId: string, input: PipelineInput): Promise<Pipeline> {
    return this.http.put<Pipeline>(
      `/api/v1/pipelines/${pipelineId}`,
      input as unknown as Record<string, unknown>,
    );
  }

  /** Delete a pipeline. */
  async delete(pipelineId: string): Promise<void> {
    await this.http.delete(`/api/v1/pipelines/${pipelineId}`);
  }

  /** Append a step to an existing pipeline. */
  async appendStep(
    pipelineId: string,
    step: PipelineStep,
  ): Promise<Pipeline> {
    return this.http.post<Pipeline>(
      `/api/v1/pipelines/${pipelineId}/steps`,
      step as unknown as Record<string, unknown>,
    );
  }

  /**
   * Run a pipeline end-to-end. Runs chain multiple agent steps and can
   * take minutes, so this call gets a 10-minute deadline.
   */
  async run(
    pipelineId: string,
    input?: Record<string, unknown>,
  ): Promise<PipelineRun> {
    return this.http.request<PipelineRun>(
      "POST",
      `/api/v1/pipelines/${pipelineId}/run`,
      {
        body: { input },
        timeoutMs: PIPELINE_RUN_TIMEOUT_MS,
      },
    );
  }
}

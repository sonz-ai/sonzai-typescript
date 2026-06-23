import type { HTTPClient } from "../http.js";
import type {
  Pipeline,
  PipelineInput,
  PipelineListResponse,
  PipelineRun,
  PipelineRunListResponse,
  PipelineStep,
} from "../types.js";

/** Default poll interval for {@link Pipelines.runAndWait}. */
const DEFAULT_RUN_POLL_INTERVAL_MS = 2_000;

/** Default overall deadline for {@link Pipelines.runAndWait} (30 minutes). */
const DEFAULT_RUN_WAIT_TIMEOUT_MS = 1_800_000;

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
   * Enqueue a pipeline run. Returns immediately (HTTP 202) with the queued
   * {@link PipelineRun} (`status: "queued"`). Poll {@link getRun} until
   * `status` is `"completed"` or `"failed"`, or use {@link runAndWait}.
   */
  async run(
    pipelineId: string,
    input?: Record<string, unknown>,
  ): Promise<PipelineRun> {
    return this.http.post<PipelineRun>(
      `/api/v1/pipelines/${pipelineId}/run`,
      { input },
    );
  }

  /** Fetch a single pipeline run by id (used to poll run status). */
  async getRun(pipelineId: string, runId: string): Promise<PipelineRun> {
    return this.http.get<PipelineRun>(
      `/api/v1/pipelines/${pipelineId}/runs/${runId}`,
    );
  }

  /** List all runs for a pipeline. */
  async listRuns(pipelineId: string): Promise<PipelineRunListResponse> {
    return this.http.get<PipelineRunListResponse>(
      `/api/v1/pipelines/${pipelineId}/runs`,
    );
  }

  /**
   * Enqueue a pipeline run and poll until it reaches a terminal state.
   *
   * Calls {@link run}, then polls {@link getRun} every `pollIntervalMs`
   * (default 2s) until `status` is `"completed"` or `"failed"`. Throws if
   * `timeoutMs` (default 30 minutes) elapses first.
   */
  async runAndWait(
    pipelineId: string,
    input?: Record<string, unknown>,
    opts?: { pollIntervalMs?: number; timeoutMs?: number },
  ): Promise<PipelineRun> {
    const pollIntervalMs = opts?.pollIntervalMs ?? DEFAULT_RUN_POLL_INTERVAL_MS;
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_RUN_WAIT_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;

    const queued = await this.run(pipelineId, input);
    const runId = queued.run_id;

    let run = queued;
    while (run.status !== "completed" && run.status !== "failed") {
      if (Date.now() >= deadline) {
        throw new Error(
          `Pipeline run ${runId} did not complete within ${timeoutMs}ms ` +
            `(last status: "${run.status}")`,
        );
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      run = await this.getRun(pipelineId, runId);
    }
    return run;
  }
}

import type { HTTPClient } from "../http.js";
import type {
  EvalRun,
  EvalRunListOptions,
  EvalRunListResponse,
  SessionResponse,
} from "../types.js";

export class EvalRuns {
  constructor(private readonly http: HTTPClient) {}

  /** List eval runs. */
  async list(options: EvalRunListOptions = {}): Promise<EvalRunListResponse> {
    return this.http.get<EvalRunListResponse>("/api/v1/eval-runs", {
      agent_id: options.agentId,
      limit: options.limit,
      offset: options.offset,
    });
  }

  /** Get a specific eval run. */
  async get(runId: string): Promise<EvalRun> {
    return this.http.get<EvalRun>(`/api/v1/eval-runs/${runId}`);
  }

  /** Delete an eval run. */
  async delete(runId: string): Promise<SessionResponse> {
    return this.http.delete<SessionResponse>(`/api/v1/eval-runs/${runId}`);
  }
}

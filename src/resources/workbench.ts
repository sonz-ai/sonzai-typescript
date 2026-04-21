import type { HTTPClient } from "../http.js";
import type {
  AdvanceTimeJob,
  AdvanceTimeOptions,
  AdvanceTimeResponse,
} from "../types.js";

/**
 * Workbench (time-machine / harness) operations.
 *
 * These endpoints back the in-app workbench UI and the benchmark harness.
 * They run the production CE worker fleet (decays, consolidation, diary,
 * constellation extraction, wakeup processing) against a tenant-scoped
 * sandbox — the workbench IS production in accelerated time, not a separate
 * code path.
 *
 * The primary entry point is {@link Workbench.advanceTime}. For long
 * simulated windows that exceed a proxy read timeout (e.g. Cloudflare's
 * ~100s), pass `runAsync: true` and poll {@link Workbench.getAdvanceTimeJob}
 * until the status is terminal.
 */
export class Workbench {
  constructor(private readonly http: HTTPClient) {}

  /**
   * Advance the simulated clock by `simulatedHours`.
   *
   * Runs the full CE worker fleet for each full 24-hour day contained in
   * the window, then processes proactive wakeups due inside it. For a
   * single day, pass `simulatedHours: 25` so the weekly gate can tick.
   *
   * When `runAsync` is true the server returns 202 with a job descriptor
   * ({@link AdvanceTimeJob}); call {@link getAdvanceTimeJob} to poll.
   * Otherwise the call blocks until the run completes and returns the
   * full {@link AdvanceTimeResponse}.
   */
  async advanceTime(
    options: AdvanceTimeOptions,
  ): Promise<AdvanceTimeResponse | AdvanceTimeJob> {
    const body: Record<string, unknown> = {
      simulated_hours: options.simulatedHours,
      simulated_base_offset_hours: options.simulatedBaseOffsetHours ?? 0,
      // Both fields are required by the server struct tag. The handler
      // falls back to agent_id when character_config is empty, and the
      // empty string instance_id means "use tenant scoping".
      character_config: options.characterConfig ?? {},
      instance_id: options.instanceId ?? "",
      agent_id: options.agentId,
      user_id: options.userId,
    };
    if (options.runAsync) body.async = true;

    return this.http.post<AdvanceTimeResponse | AdvanceTimeJob>(
      "/api/v1/workbench/advance-time",
      body,
    );
  }

  /**
   * Fetch the current state of an async advance-time job.
   *
   * The job state is kept in Redis with a 30-minute TTL. Poll within that
   * window until `status` is "succeeded" (then `result` is populated) or
   * "failed" (then `error` is populated).
   */
  async getAdvanceTimeJob(jobId: string): Promise<AdvanceTimeJob> {
    return this.http.get<AdvanceTimeJob>(
      `/api/v1/workbench/advance-time/jobs/${jobId}`,
    );
  }

  /** Prepare the workbench for a run. Server defines the body shape. */
  async prepare(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/prepare",
      body,
    );
  }

  /** Get current workbench state. Uses POST to accept a body. */
  async getState(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/state",
      body,
    );
  }

  /** Reset the workbench agent's data. */
  async resetAgent(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/reset-agent",
      body,
    );
  }

  /** Trigger session-end processing for the workbench agent. */
  async sessionEnd(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/session-end",
      body,
    );
  }

  /** Generate a simulated user turn. */
  async simulateUser(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/simulate-user",
      body,
    );
  }

  /** Generate an agent bio via the workbench flow. */
  async generateBio(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/generate-bio",
      body,
    );
  }

  /** Generate a full character (personality + bio + seeds) via workbench. */
  async generateCharacter(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/generate-character",
      body,
    );
  }

  /** Generate seed memories for the workbench agent. */
  async generateSeedMemories(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/generate-seed-memories",
      body,
    );
  }

  /**
   * Workbench chat (passthrough; non-streaming aggregate).
   *
   * The server endpoint is SSE, but this helper posts a JSON body and
   * returns the aggregated result. Callers who want per-event streaming
   * should wire {@link HTTPClient.streamSSE} directly.
   */
  async chat(
    body: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/workbench/chat",
      body,
    );
  }
}

import type { HTTPClient } from "../http.js";

/**
 * Workbench operations — interactive testing sandbox.
 *
 * Request/response shapes are untyped on the server side; bodies/returns
 * are plain records. When Huma adds schemas, we can tighten these.
 */
export class Workbench {
  constructor(private readonly http: HTTPClient) {}

  /** Prepare the workbench for a run. */
  prepare(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/prepare", body);
  }

  /** Get current workbench state. */
  getState(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/state", body);
  }

  /** Advance simulated time in the workbench. */
  advanceTime(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/advance-time", body);
  }

  /** Send a workbench chat turn (non-streaming). */
  chat(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/chat", body);
  }

  /** Generate a simulated user turn. */
  simulateUser(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/simulate-user", body);
  }

  /** Trigger session-end processing. */
  sessionEnd(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/session-end", body);
  }

  /** Reset the workbench agent's data. */
  resetAgent(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/reset-agent", body);
  }

  /** Generate an agent bio from current workbench context. */
  generateBio(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/generate-bio", body);
  }

  /** Generate a full character (personality + bio + seed memories). */
  generateCharacter(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/generate-character", body);
  }

  /** Generate agent seed memories. */
  generateSeedMemories(body: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/workbench/generate-seed-memories", body);
  }
}

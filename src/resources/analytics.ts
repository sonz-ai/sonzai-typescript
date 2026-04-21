import type { HTTPClient } from "../http.js";

export class Analytics {
  constructor(private readonly http: HTTPClient) {}

  /** Get analytics overview for the current project. */
  getOverview(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/analytics/overview");
  }

  /** Get real-time analytics for the current project. */
  getRealtime(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/analytics/realtime");
  }

  /** Get usage analytics. days: 1–365, default 30. */
  getUsage(options: { days?: number } = {}): Promise<Record<string, unknown>> {
    const params: Record<string, number | undefined> = {};
    if (options.days != null) params.days = options.days;
    return this.http.get("/api/v1/analytics/usage", params);
  }

  /** Get cost analytics. days: 1–365, default 30. */
  getCost(options: { days?: number } = {}): Promise<Record<string, unknown>> {
    const params: Record<string, number | undefined> = {};
    if (options.days != null) params.days = options.days;
    return this.http.get("/api/v1/analytics/cost", params);
  }

  /** Get cost breakdown by model/agent. days: 1–365, default 30. */
  getCostBreakdown(options: { days?: number } = {}): Promise<Record<string, unknown>> {
    const params: Record<string, number | undefined> = {};
    if (options.days != null) params.days = options.days;
    return this.http.get("/api/v1/analytics/cost/breakdown", params);
  }
}

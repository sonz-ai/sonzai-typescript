import type { HTTPClient } from "../http.js";
import type {
  CreateScheduleInputBody,
  CreateScheduleOutputBody,
  ListSchedulesOutputBody,
  PatchScheduleInputBody,
  ScheduleDTO,
  UpcomingScheduleOutputBody,
} from "../generated/flat-exports.js";

export interface ScheduleUpcomingOptions {
  /** Number of upcoming fire times to preview (1..100). Default: 10. */
  limit?: number;
}

/**
 * Recurring per-user schedules.
 *
 * The platform computes `next_fire_at` from the supplied cadence
 * (`{simple: {...}}` or `{cron: "..."}`) and honors any `active_window`
 * filter for quiet hours / days-of-week.
 */
export class Schedules {
  constructor(private readonly http: HTTPClient) {}

  /** List all schedules for a (agent, user) pair. */
  async list(
    agentId: string,
    userId: string,
  ): Promise<ListSchedulesOutputBody> {
    return this.http.get<ListSchedulesOutputBody>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/schedules`,
    );
  }

  /** Create a recurring schedule for a user. */
  async create(
    agentId: string,
    userId: string,
    body: CreateScheduleInputBody,
  ): Promise<CreateScheduleOutputBody> {
    return this.http.post<CreateScheduleOutputBody>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/schedules`,
      body as unknown as Record<string, unknown>,
    );
  }

  /** Fetch a single schedule by ID. */
  async get(
    agentId: string,
    userId: string,
    scheduleId: string,
  ): Promise<ScheduleDTO> {
    return this.http.get<ScheduleDTO>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/schedules/${scheduleId}`,
    );
  }

  /**
   * Partially update a schedule.
   *
   * `next_fire_at` is recomputed only when `cadence`, `active_window`, or
   * `starts_at` change.
   */
  async update(
    agentId: string,
    userId: string,
    scheduleId: string,
    body: PatchScheduleInputBody,
  ): Promise<ScheduleDTO> {
    return this.http.patch<ScheduleDTO>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/schedules/${scheduleId}`,
      body as unknown as Record<string, unknown>,
    );
  }

  /** Delete a schedule. Idempotent — missing IDs return 204. */
  async delete(
    agentId: string,
    userId: string,
    scheduleId: string,
  ): Promise<void> {
    await this.http.delete(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/schedules/${scheduleId}`,
    );
  }

  /** Preview the next N allowed fire times. Does not mutate state. */
  async upcoming(
    agentId: string,
    userId: string,
    scheduleId: string,
    options: ScheduleUpcomingOptions = {},
  ): Promise<UpcomingScheduleOutputBody> {
    return this.http.get<UpcomingScheduleOutputBody>(
      `/api/v1/agents/${agentId}/users/${encodeURIComponent(userId)}/schedules/${scheduleId}/upcoming`,
      { limit: options.limit },
    );
  }
}

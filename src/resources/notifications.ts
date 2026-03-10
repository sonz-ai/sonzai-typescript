import type { HTTPClient } from "../http.js";
import type {
  NotificationListOptions,
  NotificationListResponse,
  SessionResponse,
} from "../types.js";

export class Notifications {
  constructor(private readonly http: HTTPClient) {}

  /** List notifications for an agent. */
  async list(
    agentId: string,
    options: NotificationListOptions = {},
  ): Promise<NotificationListResponse> {
    return this.http.get<NotificationListResponse>(
      `/api/v1/agents/${agentId}/notifications`,
      {
        status: options.status,
        user_id: options.userId,
        limit: options.limit,
      },
    );
  }

  /** Mark a notification as consumed. */
  async consume(
    agentId: string,
    messageId: string,
  ): Promise<SessionResponse> {
    return this.http.post<SessionResponse>(
      `/api/v1/agents/${agentId}/notifications/${messageId}/consume`,
    );
  }

  /** List notification history. */
  async history(
    agentId: string,
    options: { limit?: number } = {},
  ): Promise<NotificationListResponse> {
    return this.http.get<NotificationListResponse>(
      `/api/v1/agents/${agentId}/notifications/history`,
      { limit: options.limit },
    );
  }
}

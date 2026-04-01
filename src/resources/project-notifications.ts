import type { HTTPClient } from "../http.js";
import type {
  ProjectNotificationListOptions,
  ProjectNotificationListResponse,
  AcknowledgeNotificationsOptions,
  AcknowledgeResponse,
  AcknowledgeAllOptions,
} from "../types.js";

/** Project-scoped notification polling for game backends. */
export class ProjectNotifications {
  constructor(private readonly http: HTTPClient) {}

  /** List pending notifications for a project. */
  async list(
    projectId: string,
    options: ProjectNotificationListOptions = {},
  ): Promise<ProjectNotificationListResponse> {
    const params: Record<string, string> = {};
    if (options.agentId) params.agent_id = options.agentId;
    if (options.eventType) params.event_type = options.eventType;
    if (options.limit) params.limit = String(options.limit);
    return this.http.get<ProjectNotificationListResponse>(
      `/api/v1/projects/${projectId}/notifications`,
      params,
    );
  }

  /** Acknowledge specific notifications by ID. */
  async acknowledge(
    projectId: string,
    options: AcknowledgeNotificationsOptions,
  ): Promise<AcknowledgeResponse> {
    return this.http.post<AcknowledgeResponse>(
      `/api/v1/projects/${projectId}/notifications/acknowledge`,
      { notification_ids: options.notificationIds } as unknown as Record<string, unknown>,
    );
  }

  /** Acknowledge all pending notifications for a project. */
  async acknowledgeAll(
    projectId: string,
    options: AcknowledgeAllOptions = {},
  ): Promise<AcknowledgeResponse> {
    const params: Record<string, string> = {};
    if (options.agentId) params.agent_id = options.agentId;
    if (options.eventType) params.event_type = options.eventType;
    return this.http.post<AcknowledgeResponse>(
      `/api/v1/projects/${projectId}/notifications/acknowledge-all`,
      {},
      params,
    );
  }
}

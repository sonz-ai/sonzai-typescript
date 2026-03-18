import type { HTTPClient } from "../http.js";
import type {
  DeliveryAttemptsResponse,
  WebhookListResponse,
  WebhookRegisterOptions,
  WebhookRegisterResponse,
} from "../types.js";

/** Webhook management operations. */
export class Webhooks {
  constructor(private readonly http: HTTPClient) {}

  /** Register (or update) a webhook URL for an event type. */
  async register(
    eventType: string,
    options: WebhookRegisterOptions,
  ): Promise<WebhookRegisterResponse> {
    const body: Record<string, unknown> = {
      webhook_url: options.webhookUrl,
    };
    if (options.authHeader) body.auth_header = options.authHeader;

    return this.http.put<WebhookRegisterResponse>(
      `/api/v1/webhooks/${eventType}`,
      body,
    );
  }

  /** List all registered webhooks. */
  async list(): Promise<WebhookListResponse> {
    return this.http.get<WebhookListResponse>("/api/v1/webhooks");
  }

  /** Delete a webhook for an event type. */
  async delete(eventType: string): Promise<void> {
    await this.http.delete(`/api/v1/webhooks/${eventType}`);
  }

  /** List recent delivery attempts for an event type. */
  async listDeliveryAttempts(
    eventType: string,
  ): Promise<DeliveryAttemptsResponse> {
    return this.http.get<DeliveryAttemptsResponse>(
      `/api/v1/webhooks/${eventType}/attempts`,
    );
  }

  /** Rotate the signing secret for a webhook event type. */
  async rotateSecret(
    eventType: string,
  ): Promise<WebhookRegisterResponse> {
    return this.http.post<WebhookRegisterResponse>(
      `/api/v1/webhooks/${eventType}/rotate-secret`,
    );
  }
}

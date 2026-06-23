import type { HTTPClient } from "../http.js";
import type {
  Channel,
  ChannelListResponse,
  ChannelWriteOptions,
} from "../types.js";

/** Notification channel management operations (webhook / email / composio). */
export class Channels {
  constructor(private readonly http: HTTPClient) {}

  /** List all notification channels for the current project. */
  async list(): Promise<ChannelListResponse> {
    return this.http.get<ChannelListResponse>("/api/v1/channels");
  }

  /** Create a new notification channel. */
  async create(options: ChannelWriteOptions): Promise<Channel> {
    return this.http.post<Channel>(
      "/api/v1/channels",
      options as unknown as Record<string, unknown>,
    );
  }

  /** Get a single notification channel by id. */
  async get(channelId: string): Promise<Channel> {
    return this.http.get<Channel>(`/api/v1/channels/${channelId}`);
  }

  /** Update an existing notification channel. */
  async update(
    channelId: string,
    options: ChannelWriteOptions,
  ): Promise<Channel> {
    return this.http.put<Channel>(
      `/api/v1/channels/${channelId}`,
      options as unknown as Record<string, unknown>,
    );
  }

  /** Delete a notification channel. */
  async delete(channelId: string): Promise<void> {
    await this.http.delete(`/api/v1/channels/${channelId}`);
  }
}

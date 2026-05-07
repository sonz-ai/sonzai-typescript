import type { HTTPClient } from "../http.js";
import type {
  AddCommentRequest,
  CreateTicketRequest,
  SupportTicket,
  SupportTicketComment,
  TicketDetailResponse,
  TicketListResponse,
} from "../generated/flat-exports.js";

export interface SupportListOptions {
  /** Page size, max 100. Default 100. */
  limit?: number;
  /** Offset for pagination. Default 0. */
  offset?: number;
  /** Optional status filter (e.g. `"open"`, `"resolved"`). */
  status?: string;
  /** Optional type filter (e.g. `"bug"`, `"feature_request"`, `"billing"`). */
  type?: string;
}

export interface CreateTicketOptions {
  title: string;
  description: string;
  type: string;
  /** Server defaults to `"medium"` if omitted. */
  priority?: string;
}

export interface AddTicketCommentOptions {
  content: string;
  /** Ignored unless the caller is staff. */
  isInternal?: boolean;
}

/**
 * Support tickets resource — wraps `/api/v1/support/tickets/...`.
 *
 * Authenticated via the caller's session; the caller's user ID and active
 * tenant scope all reads and writes server-side.
 */
export class Support {
  constructor(private readonly http: HTTPClient) {}

  /** List tickets in the caller's active tenant. Offset-paginated. */
  async list(options: SupportListOptions = {}): Promise<TicketListResponse> {
    return this.http.get<TicketListResponse>("/api/v1/support/tickets", {
      limit: options.limit,
      offset: options.offset,
      status: options.status,
      type: options.type,
    });
  }

  /** Create a new support ticket. */
  async create(options: CreateTicketOptions): Promise<SupportTicket> {
    const body: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      type: options.type,
    };
    if (options.priority !== undefined) body.priority = options.priority;
    const _typed: CreateTicketRequest = body as CreateTicketRequest;
    void _typed;
    return this.http.post<SupportTicket>("/api/v1/support/tickets", body);
  }

  /** Fetch a single ticket with its history. */
  async get(ticketId: string): Promise<TicketDetailResponse> {
    return this.http.get<TicketDetailResponse>(
      `/api/v1/support/tickets/${encodeURIComponent(ticketId)}`,
    );
  }

  /** Append a comment to a ticket. */
  async addComment(
    ticketId: string,
    options: AddTicketCommentOptions,
  ): Promise<SupportTicketComment> {
    const body: Record<string, unknown> = { content: options.content };
    if (options.isInternal !== undefined) body.is_internal = options.isInternal;
    const _typed: AddCommentRequest = body as AddCommentRequest;
    void _typed;
    return this.http.post<SupportTicketComment>(
      `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/comments`,
      body,
    );
  }

  /** Close a ticket. Only the creator may close their own ticket. */
  async close(ticketId: string): Promise<SupportTicket> {
    return this.http.post<SupportTicket>(
      `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/close`,
      {},
    );
  }
}

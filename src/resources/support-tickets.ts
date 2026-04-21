import type { HTTPClient } from "../http.js";
import type {
  AddCommentRequest,
  CreateTicketRequest,
  ListSupportTicketsOptions,
  SupportTicket,
  SupportTicketComment,
  TicketDetailResponse,
  TicketListResponse,
} from "../types.js";

function requireNonEmpty(value: string, name: string): void {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Support ticket management for the authenticated user.
 *
 * Every call is scoped to the caller's tenant (resolved server-side from
 * the Clerk session) — listings and lookups only return tickets the caller
 * created. Users can open tickets, add comments, and close tickets they
 * own; staff-only operations (assignment, internal comments, resolution)
 * live in the admin portal, not this SDK.
 */
export class SupportTickets {
  constructor(private readonly http: HTTPClient) {}

  /** List support tickets created by the authenticated user. */
  async list(
    options: ListSupportTicketsOptions = {},
  ): Promise<TicketListResponse> {
    const params: Record<string, string> = {};
    if (options.limit != null) params.limit = String(options.limit);
    if (options.offset != null) params.offset = String(options.offset);
    if (options.status) params.status = options.status;
    if (options.type) params.type = options.type;
    return this.http.get<TicketListResponse>(
      "/api/v1/support/tickets",
      params,
    );
  }

  /** Create a new support ticket in the caller's tenant. */
  async create(options: CreateTicketRequest): Promise<SupportTicket> {
    const body: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      type: options.type,
    };
    if (options.priority) body.priority = options.priority;
    return this.http.post<SupportTicket>("/api/v1/support/tickets", body);
  }

  /** Get a single ticket with its comment thread and history. */
  async get(ticketId: string): Promise<TicketDetailResponse> {
    requireNonEmpty(ticketId, "ticketId");
    return this.http.get<TicketDetailResponse>(
      `/api/v1/support/tickets/${ticketId}`,
    );
  }

  /** Close a ticket. Only the ticket's original creator may close it. */
  async close(ticketId: string): Promise<SupportTicket> {
    requireNonEmpty(ticketId, "ticketId");
    return this.http.post<SupportTicket>(
      `/api/v1/support/tickets/${ticketId}/close`,
    );
  }

  /**
   * Add a user comment to a ticket. User comments are always external
   * (`is_internal=false`); internal comments are staff-only.
   */
  async addComment(
    ticketId: string,
    options: AddCommentRequest,
  ): Promise<SupportTicketComment> {
    requireNonEmpty(ticketId, "ticketId");
    const body: Record<string, unknown> = { content: options.content };
    if (options.is_internal != null) body.is_internal = options.is_internal;
    return this.http.post<SupportTicketComment>(
      `/api/v1/support/tickets/${ticketId}/comments`,
      body,
    );
  }
}

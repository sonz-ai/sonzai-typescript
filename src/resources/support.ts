import type { HTTPClient } from "../http.js";
import type {
  AddTicketCommentOptions,
  CreateTicketOptions,
  ListMyTicketsOptions,
  SupportTicket,
  SupportTicketComment,
  TicketDetailResponse,
  TicketListResponse,
} from "../types.js";

/** Support-ticket operations for the caller. */
export class Support {
  constructor(private readonly http: HTTPClient) {}

  /**
   * List tickets owned by the caller.
   *
   * @param options - pagination and filters (status, type)
   */
  listTickets(options: ListMyTicketsOptions = {}): Promise<TicketListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (options.limit != null) params.limit = options.limit;
    if (options.offset != null) params.offset = options.offset;
    if (options.status) params.status = options.status;
    if (options.type) params.type = options.type;
    return this.http.get<TicketListResponse>("/api/v1/support/tickets", params);
  }

  /** Create a support ticket. */
  createTicket(options: CreateTicketOptions): Promise<SupportTicket> {
    return this.http.post<SupportTicket>(
      "/api/v1/support/tickets",
      options as unknown as Record<string, unknown>,
    );
  }

  /** Get a ticket with comments and history. */
  getTicket(ticketId: string): Promise<TicketDetailResponse> {
    return this.http.get<TicketDetailResponse>(
      `/api/v1/support/tickets/${encodeURIComponent(ticketId)}`,
    );
  }

  /** Close a ticket as the ticket's owner. */
  closeTicket(ticketId: string): Promise<SupportTicket> {
    return this.http.post<SupportTicket>(
      `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/close`,
      {},
    );
  }

  /** Add a comment to a ticket. */
  addComment(
    ticketId: string,
    options: AddTicketCommentOptions,
  ): Promise<SupportTicketComment> {
    return this.http.post<SupportTicketComment>(
      `/api/v1/support/tickets/${encodeURIComponent(ticketId)}/comments`,
      options as unknown as Record<string, unknown>,
    );
  }
}

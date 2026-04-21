import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  Sonzai,
  NotFoundError,
  PermissionDeniedError,
} from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

describe("SupportTickets.list", () => {
  it("GETs /support/tickets without query params by default", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE_URL}/api/v1/support/tickets`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          tickets: [
            {
              ticket_id: "t-1",
              title: "Cannot log in",
              type: "support",
              status: "open",
              priority: "medium",
              created_by_email: "user@example.com",
              comment_count: 0,
              created_at: "2026-04-21T10:00:00Z",
              updated_at: "2026-04-21T10:00:00Z",
            },
          ],
          total: 1,
          has_more: false,
        });
      }),
    );

    const res = await client().supportTickets.list();
    expect(res.tickets).not.toBeNull();
    expect(res.tickets).toHaveLength(1);
    expect(res.tickets?.[0]?.ticket_id).toBe("t-1");
    expect(res.total).toBe(1);
    expect(res.has_more).toBe(false);
    const u = new URL(capturedUrl);
    expect(u.searchParams.get("limit")).toBeNull();
    expect(u.searchParams.get("status")).toBeNull();
  });

  it("forwards limit, offset, status, and type query params", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE_URL}/api/v1/support/tickets`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ tickets: [], total: 0, has_more: false });
      }),
    );

    await client().supportTickets.list({
      limit: 50,
      offset: 20,
      status: "open",
      type: "bug",
    });

    const u = new URL(capturedUrl);
    expect(u.searchParams.get("limit")).toBe("50");
    expect(u.searchParams.get("offset")).toBe("20");
    expect(u.searchParams.get("status")).toBe("open");
    expect(u.searchParams.get("type")).toBe("bug");
  });

  it("allows a nullable tickets array (no tickets yet)", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/support/tickets`, () => {
        return HttpResponse.json({ tickets: null, total: 0, has_more: false });
      }),
    );

    const res = await client().supportTickets.list();
    expect(res.tickets).toBeNull();
    expect(res.total).toBe(0);
  });
});

describe("SupportTickets.create", () => {
  it("POSTs the required fields and returns the created ticket", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/support/tickets`,
        async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ticket_id: "t-2",
            tenant_id: "tenant-1",
            created_by: "user-1",
            created_by_email: "user@example.com",
            title: "App crashes on launch",
            description: "Opens, then closes instantly.",
            type: "bug",
            status: "open",
            priority: "high",
            created_at: "2026-04-21T10:00:00Z",
            updated_at: "2026-04-21T10:00:00Z",
          });
        },
      ),
    );

    const res = await client().supportTickets.create({
      title: "App crashes on launch",
      description: "Opens, then closes instantly.",
      type: "bug",
      priority: "high",
    });

    expect(res.ticket_id).toBe("t-2");
    expect(res.status).toBe("open");
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.title).toBe("App crashes on launch");
    expect(capturedBody!.description).toBe("Opens, then closes instantly.");
    expect(capturedBody!.type).toBe("bug");
    expect(capturedBody!.priority).toBe("high");
  });

  it("omits priority when not supplied (server default applies)", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/support/tickets`,
        async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            ticket_id: "t-3",
            tenant_id: "tenant-1",
            created_by: "user-1",
            created_by_email: "user@example.com",
            title: "Question",
            description: "How do I ...",
            type: "support",
            status: "open",
            priority: "medium",
            created_at: "2026-04-21T10:00:00Z",
            updated_at: "2026-04-21T10:00:00Z",
          });
        },
      ),
    );

    await client().supportTickets.create({
      title: "Question",
      description: "How do I ...",
      type: "support",
    });

    expect(capturedBody).not.toBeNull();
    expect("priority" in (capturedBody as object)).toBe(false);
  });
});

describe("SupportTickets.get", () => {
  it("GETs the ticket with its comment thread and history", async () => {
    server.use(
      http.get(
        `${BASE_URL}/api/v1/support/tickets/t-1`,
        () => {
          return HttpResponse.json({
            ticket: {
              ticket_id: "t-1",
              tenant_id: "tenant-1",
              created_by: "user-1",
              created_by_email: "user@example.com",
              title: "Cannot log in",
              description: "Stuck at loading screen.",
              type: "support",
              status: "open",
              priority: "medium",
              comment_count: 1,
              comments: [
                {
                  comment_id: "c-1",
                  ticket_id: "t-1",
                  author_id: "user-1",
                  author_email: "user@example.com",
                  author_type: "user",
                  content: "Still happening after restart.",
                  is_internal: false,
                  created_at: "2026-04-21T10:05:00Z",
                },
              ],
              created_at: "2026-04-21T10:00:00Z",
              updated_at: "2026-04-21T10:05:00Z",
            },
            history: [
              {
                history_id: "h-1",
                ticket_id: "t-1",
                changed_by: "user-1",
                changed_by_email: "user@example.com",
                field_changed: "status",
                old_value: "",
                new_value: "open",
                created_at: "2026-04-21T10:00:00Z",
              },
            ],
          });
        },
      ),
    );

    const res = await client().supportTickets.get("t-1");
    expect(res.ticket.ticket_id).toBe("t-1");
    expect(res.ticket.comments).toHaveLength(1);
    expect(res.ticket.comments?.[0]?.content).toBe(
      "Still happening after restart.",
    );
    expect(res.history).toHaveLength(1);
    expect(res.history?.[0]?.field_changed).toBe("status");
  });

  it("throws NotFoundError when the ticket is not found", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/support/tickets/missing`, () => {
        return HttpResponse.json(
          { error: "ticket not found" },
          { status: 404 },
        );
      }),
    );

    await expect(client().supportTickets.get("missing")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws on empty ticketId", async () => {
    await expect(client().supportTickets.get("")).rejects.toThrow(
      "ticketId must be a non-empty string",
    );
  });
});

describe("SupportTickets.close", () => {
  it("POSTs to /close and returns the closed ticket", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/support/tickets/t-1/close`,
        () => {
          return HttpResponse.json({
            ticket_id: "t-1",
            tenant_id: "tenant-1",
            created_by: "user-1",
            created_by_email: "user@example.com",
            title: "Cannot log in",
            description: "Stuck at loading screen.",
            type: "support",
            status: "closed",
            priority: "medium",
            created_at: "2026-04-21T10:00:00Z",
            updated_at: "2026-04-21T11:00:00Z",
            resolved_at: "2026-04-21T11:00:00Z",
          });
        },
      ),
    );

    const res = await client().supportTickets.close("t-1");
    expect(res.status).toBe("closed");
    expect(res.resolved_at).toBe("2026-04-21T11:00:00Z");
  });

  it("throws PermissionDeniedError when the caller did not create the ticket", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/support/tickets/t-9/close`,
        () => {
          return HttpResponse.json(
            { error: "only the ticket creator may close this ticket" },
            { status: 403 },
          );
        },
      ),
    );

    await expect(client().supportTickets.close("t-9")).rejects.toThrow(
      PermissionDeniedError,
    );
  });

  it("throws on empty ticketId", async () => {
    await expect(client().supportTickets.close("")).rejects.toThrow(
      "ticketId must be a non-empty string",
    );
  });
});

describe("SupportTickets.addComment", () => {
  it("POSTs the comment body and returns the stored comment", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/support/tickets/t-1/comments`,
        async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            comment_id: "c-2",
            ticket_id: "t-1",
            author_id: "user-1",
            author_email: "user@example.com",
            author_type: "user",
            content: "Here's more detail.",
            is_internal: false,
            created_at: "2026-04-21T11:30:00Z",
          });
        },
      ),
    );

    const res = await client().supportTickets.addComment("t-1", {
      content: "Here's more detail.",
    });

    expect(res.comment_id).toBe("c-2");
    expect(res.is_internal).toBe(false);
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.content).toBe("Here's more detail.");
    expect("is_internal" in (capturedBody as object)).toBe(false);
  });

  it("forwards is_internal when explicitly provided", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/support/tickets/t-1/comments`,
        async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            comment_id: "c-3",
            ticket_id: "t-1",
            author_id: "user-1",
            author_email: "user@example.com",
            author_type: "user",
            content: "Server-side may still reject this.",
            is_internal: false,
            created_at: "2026-04-21T11:35:00Z",
          });
        },
      ),
    );

    await client().supportTickets.addComment("t-1", {
      content: "Server-side may still reject this.",
      is_internal: false,
    });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.is_internal).toBe(false);
  });

  it("throws on empty ticketId", async () => {
    await expect(
      client().supportTickets.addComment("", { content: "x" }),
    ).rejects.toThrow("ticketId must be a non-empty string");
  });
});

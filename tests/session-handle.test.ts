import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Session, Sonzai } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

describe("Session handle", () => {
  it("start() returns a Session bound to agent/user/session ids", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
      provider: "gemini",
      model: "gemini-3.1-flash-lite-preview",
    });
    expect(session).toBeInstanceOf(Session);
    expect(session.agentId).toBe("agent-1");
    expect(session.userId).toBe("u1");
    expect(session.sessionId).toBe("s1");
    expect(session.provider).toBe("gemini");
    expect(session.model).toBe("gemini-3.1-flash-lite-preview");
  });

  it("session.context() forwards to GET /agents/{id}/context with bound ids", async () => {
    let capturedQuery: URL | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
      http.get(`${BASE_URL}/api/v1/agents/agent-1/context`, ({ request }) => {
        capturedQuery = new URL(request.url);
        return HttpResponse.json({
          personality: { foo: "bar" },
          mood: {},
          memory: {},
        });
      }),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    const ctx = await session.context({ query: "hello there" });
    expect(ctx).toBeDefined();
    expect(capturedQuery?.searchParams.get("userId")).toBe("u1");
    expect(capturedQuery?.searchParams.get("sessionId")).toBe("s1");
    expect(capturedQuery?.searchParams.get("query")).toBe("hello there");
  });

  it("session.turn() POSTs to /agents/{id}/sessions/{sid}/turn and returns extraction_id + mood", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/s1/turn`,
        async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            extraction_id: "ext-123",
            extraction_status: "queued",
            mood: {
              valence: 0.1,
              arousal: 0.0,
              tension: -0.05,
              affiliation: 0.2,
              trigger_type: "emotional_response",
              reason: "warm greeting",
            },
          });
        },
      ),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
      provider: "gemini",
      model: "gemini-3.1-flash-lite-preview",
    });
    const result = await session.turn({
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
    });
    expect(result.extraction_id).toBe("ext-123");
    expect(result.extraction_status).toBe("queued");
    expect(result.mood?.valence).toBeCloseTo(0.1);
    // Session-level provider/model flow into the request body.
    expect(capturedBody?.provider).toBe("gemini");
    expect(capturedBody?.model).toBe("gemini-3.1-flash-lite-preview");
    expect(capturedBody?.userId).toBe("u1");
    expect(Array.isArray(capturedBody?.messages)).toBe(true);
  });

  it("per-call provider/model on .turn() override session-level defaults", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/s1/turn`,
        async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            success: true,
            extraction_id: "ext-456",
            extraction_status: "queued",
          });
        },
      ),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
      provider: "gemini",
      model: "gemini-3.1-flash-lite-preview",
    });
    await session.turn({
      messages: [{ role: "user", content: "hi" }],
      provider: "anthropic",
      model: "claude-sonnet-4.6",
    });
    expect(capturedBody?.provider).toBe("anthropic");
    expect(capturedBody?.model).toBe("claude-sonnet-4.6");
  });

  it("session.turn() with fetchNextContext returns next_context", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/s1/turn`,
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.fetchNextContext).toEqual({ query: "next user message" });
          return HttpResponse.json({
            success: true,
            extraction_id: "ext-789",
            extraction_status: "queued",
            next_context: {
              personality: { dimension: 0.5 },
              memory: { facts: [] },
            },
          });
        },
      ),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    const result = await session.turn({
      messages: [{ role: "user", content: "hi" }],
      fetchNextContext: { query: "next user message" },
    });
    expect(result.next_context).toBeDefined();
    expect((result.next_context as { personality: { dimension: number } }).personality.dimension).toBe(
      0.5,
    );
  });

  it("session.end() closes the session via /sessions/end", async () => {
    let endHits = 0;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/end`,
        async ({ request }) => {
          endHits += 1;
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.user_id).toBe("u1");
          expect(body.session_id).toBe("s1");
          return HttpResponse.json({ success: true });
        },
      ),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    const res = await session.end();
    expect(res.success).toBe(true);
    expect(endHits).toBe(1);
  });

  it("sessions.start() returns a Session whose .success mirrors the legacy SessionResponse (backward compat)", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
    );
    const sdk = client();
    const res = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    // Old shape callers reading `.success` still work.
    expect(res.success).toBe(true);
    // New shape: also a usable Session handle.
    expect(res).toBeInstanceOf(Session);
    expect(res.agentId).toBe("agent-1");
  });

  it("session.status() polls /agents/{id}/turns/{eid}/status", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/start`,
        () => HttpResponse.json({ success: true }),
      ),
      http.get(
        `${BASE_URL}/api/v1/agents/agent-1/turns/ext-123/status`,
        () =>
          HttpResponse.json({
            extraction_id: "ext-123",
            state: "done",
          }),
      ),
    );
    const sdk = client();
    const session = await sdk.agents.sessions.start("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    const status = await session.status("ext-123");
    expect(status.state).toBe("done");
    expect(status.extraction_id).toBe("ext-123");
  });
});

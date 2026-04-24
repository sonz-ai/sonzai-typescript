import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Sonzai, SonzaiError } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

describe("Sessions async polling", () => {
  it("legacy 200 response passes through without polling", async () => {
    let postHits = 0;
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/sessions/end`, () => {
        postHits += 1;
        return HttpResponse.json({ success: true, async: true });
      }),
    );
    const res = await client().agents.sessions.end("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    expect(res.success).toBe(true);
    expect(postHits).toBe(1);
  });

  it("202 with processing_id polls status until done", async () => {
    let statusHits = 0;
    const pid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/end`,
        () =>
          HttpResponse.json(
            {
              success: true,
              async: true,
              processing_id: pid,
              status_url: `/api/v1/sessions/end/status/${pid}`,
              session_id: "s1",
              agent_id: "agent-1",
              enqueued_at: "2026-04-24T10:00:00Z",
            },
            { status: 202 },
          ),
      ),
      http.get(
        `${BASE_URL}/api/v1/sessions/end/status/${pid}`,
        () => {
          statusHits += 1;
          if (statusHits === 1) {
            return HttpResponse.json({
              state: "processing",
              enqueued_at: "2026-04-24T10:00:00Z",
              session_id: "s1",
              agent_id: "agent-1",
            });
          }
          return HttpResponse.json({
            state: "done",
            enqueued_at: "2026-04-24T10:00:00Z",
            started_at: "2026-04-24T10:00:01Z",
            finished_at: "2026-04-24T10:00:30Z",
            session_id: "s1",
            agent_id: "agent-1",
          });
        },
      ),
    );

    const res = await client().agents.sessions.end("agent-1", {
      userId: "u1",
      sessionId: "s1",
    });
    expect(res.success).toBe(true);
    expect(statusHits).toBe(2);
  });

  it("failed state surfaces SonzaiError with reason", async () => {
    const pid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/end`,
        () =>
          HttpResponse.json(
            {
              success: true,
              async: true,
              processing_id: pid,
              status_url: `/api/v1/sessions/end/status/${pid}`,
              session_id: "s1",
              agent_id: "agent-1",
            },
            { status: 202 },
          ),
      ),
      http.get(
        `${BASE_URL}/api/v1/sessions/end/status/${pid}`,
        () =>
          HttpResponse.json({
            state: "failed",
            enqueued_at: "2026-04-24T10:00:00Z",
            session_id: "s1",
            agent_id: "agent-1",
            error: "LLM upstream timeout",
          }),
      ),
    );

    await expect(
      client().agents.sessions.end("agent-1", {
        userId: "u1",
        sessionId: "s1",
      }),
    ).rejects.toThrow(/LLM upstream timeout/);
  });

  it("poll timeout surfaces error on stuck pending", async () => {
    const pid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/sessions/end`,
        () =>
          HttpResponse.json(
            {
              success: true,
              async: true,
              processing_id: pid,
              status_url: `/api/v1/sessions/end/status/${pid}`,
              session_id: "s1",
              agent_id: "agent-1",
            },
            { status: 202 },
          ),
      ),
      http.get(
        `${BASE_URL}/api/v1/sessions/end/status/${pid}`,
        () =>
          HttpResponse.json({
            state: "pending",
            enqueued_at: "2026-04-24T10:00:00Z",
            session_id: "s1",
            agent_id: "agent-1",
          }),
      ),
    );

    const start = Date.now();
    let err: unknown;
    try {
      await client().agents.sessions.end("agent-1", {
        userId: "u1",
        sessionId: "s1",
        pollTimeoutMs: 300,
      });
    } catch (e) {
      err = e;
    }
    const elapsed = Date.now() - start;
    expect(err).toBeInstanceOf(SonzaiError);
    expect(String(err)).toMatch(/timed out/);
    expect(elapsed).toBeLessThan(2000);
  });
});

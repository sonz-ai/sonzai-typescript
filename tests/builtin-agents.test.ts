import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Sonzai, StreamError } from "../src/index.js";
import type { BuiltinAgentUpdate } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

const sampleInvokeResult = {
  findings: { leads: [{ company: "Acme" }] },
  summary: "Found 1 lead.",
  session_id: "sess-1",
  model: "vertical-task-v1",
  byok: false,
  usage: {
    input_tokens: 100,
    output_tokens: 50,
    cache_creation_input_tokens: 10,
    cache_read_input_tokens: 5,
  },
  running_seconds: 42.5,
  cost_usd: 0.123,
};

const sampleSession = {
  id: "sess-1",
  agent: "market_intel",
  model: "vertical-task-v1",
  status: "active",
  title: "Makati CBD",
  byok: false,
  cost_usd: 0.05,
  created_at: "2026-06-10T00:00:00Z",
};

/** Wraps named SSE frames into the wire body the SDK expects. */
function sseBody(
  frames: Array<{ event: string; data: Record<string, unknown> }>,
): string {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n`)
    .join("\n")
    .concat("\n");
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

describe("BuiltinAgents.list", () => {
  it("lists the catalog (GET /builtin-agents)", async () => {
    let captured: { method: string; url: string } | null = null;
    server.use(
      http.get(`${BASE_URL}/api/v1/builtin-agents`, ({ request }) => {
        captured = { method: request.method, url: request.url };
        return HttpResponse.json({
          agents: [
            {
              slug: "lead_research",
              name: "Lead Research",
              description: "Deep-researches a target account.",
              model: "vertical-task-v1",
              provisioned: true,
            },
          ],
        });
      }),
    );

    const res = await client().builtinAgents.list();

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("GET");
    expect(captured!.url).toBe(`${BASE_URL}/api/v1/builtin-agents`);
    expect(res.agents).toHaveLength(1);
    expect(res.agents[0]?.slug).toBe("lead_research");
    expect(res.agents[0]?.provisioned).toBe(true);
  });

  it("returns [] when agents is null", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/builtin-agents`, () =>
        HttpResponse.json({ agents: null }),
      ),
    );

    const res = await client().builtinAgents.list();
    expect(res.agents).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Invoke (blocking)
// ---------------------------------------------------------------------------

describe("BuiltinAgents.invoke", () => {
  it("POSTs to .../invoke?stream=false and returns the InvokeResult", async () => {
    let captured: {
      method: string;
      url: string;
      body: Record<string, unknown>;
    } | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/lead_research/invoke`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json(sampleInvokeResult);
        },
      ),
    );

    const res = await client().builtinAgents.invoke("lead_research", {
      input: { company: "Acme" },
      title: "Acme deep-dive",
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/lead_research/invoke?stream=false`,
    );
    expect(captured!.body).toEqual({
      input: { company: "Acme" },
      title: "Acme deep-dive",
    });
    expect(res.summary).toBe("Found 1 lead.");
    expect(res.session_id).toBe("sess-1");
    expect(res.usage.input_tokens).toBe(100);
    expect(res.cost_usd).toBe(0.123);
  });

  it("omits title when not provided", async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/lead_score/invoke`,
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(sampleInvokeResult);
        },
      ),
    );

    await client().builtinAgents.invoke("lead_score", {
      input: { lead_id: "l-1" },
    });

    expect(body).toEqual({ input: { lead_id: "l-1" } });
  });

  it("rejects an empty slug", async () => {
    await expect(
      client().builtinAgents.invoke("", { input: {} }),
    ).rejects.toThrow("slug must be a non-empty string");
  });
});

// ---------------------------------------------------------------------------
// Invoke (streaming SSE)
// ---------------------------------------------------------------------------

describe("BuiltinAgents.invokeStream", () => {
  it("parses the named-event SSE envelope and returns the result", async () => {
    let captured: { url: string; body: Record<string, unknown> } | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/market_intel/invoke`,
        async ({ request }) => {
          captured = {
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          const body = sseBody([
            { event: "update", data: { type: "status", text: "Starting" } },
            {
              event: "update",
              data: { type: "tool_use", tool: "web_search", elapsed: 3.2 },
            },
            {
              event: "update",
              data: {
                type: "tool_result",
                tool: "web_search",
                detail: { hits: 7 },
              },
            },
            { event: "update", data: { type: "findings", text: "drafting" } },
            { event: "result", data: sampleInvokeResult },
          ]);
          return new HttpResponse(body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        },
      ),
    );

    const updates: BuiltinAgentUpdate[] = [];
    const res = await client().builtinAgents.invokeStream("market_intel", {
      input: { region: "PH" },
      onUpdate: (u) => {
        updates.push(u);
      },
    });

    expect(captured).not.toBeNull();
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/market_intel/invoke?stream=true`,
    );
    expect(captured!.body).toEqual({ input: { region: "PH" } });

    expect(updates).toHaveLength(4);
    expect(updates[0]?.type).toBe("status");
    expect(updates[0]?.text).toBe("Starting");
    expect(updates[1]?.type).toBe("tool_use");
    expect(updates[1]?.tool).toBe("web_search");
    expect(updates[1]?.elapsed).toBe(3.2);
    expect(updates[2]?.detail).toEqual({ hits: 7 });

    expect(res.summary).toBe("Found 1 lead.");
    expect(res.usage.output_tokens).toBe(50);
  });

  it("handles frames split across chunk boundaries (synthetic stream)", async () => {
    // Split the raw SSE body at awkward byte offsets to exercise the
    // incremental line-buffer in streamNamedSSE.
    const raw = sseBody([
      { event: "update", data: { type: "thinking", text: "hmm…" } },
      { event: "result", data: sampleInvokeResult },
    ]);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(raw);
    const cut1 = 7; // mid "event: update"
    const cut2 = Math.floor(bytes.length / 2); // mid result JSON

    server.use(
      http.post(`${BASE_URL}/api/v1/builtin-agents/lead_extract/invoke`, () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes.slice(0, cut1));
            controller.enqueue(bytes.slice(cut1, cut2));
            controller.enqueue(bytes.slice(cut2));
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const updates: BuiltinAgentUpdate[] = [];
    const res = await client().builtinAgents.invokeStream("lead_extract", {
      input: { url: "https://example.com" },
      onUpdate: (u) => {
        updates.push(u);
      },
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]?.type).toBe("thinking");
    expect(updates[0]?.text).toBe("hmm…");
    expect(res.session_id).toBe("sess-1");
  });

  it("throws StreamError on an `event: error` frame", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/lead_qualifier/invoke`,
        () => {
          const body = sseBody([
            { event: "update", data: { type: "status", text: "Starting" } },
            { event: "error", data: { error: "agent run failed: budget" } },
          ]);
          return new HttpResponse(body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        },
      ),
    );

    await expect(
      client().builtinAgents.invokeStream("lead_qualifier", { input: {} }),
    ).rejects.toThrow(StreamError);
    await expect(
      client().builtinAgents.invokeStream("lead_qualifier", { input: {} }),
    ).rejects.toThrow("agent run failed: budget");
  });

  it("throws StreamError when the stream ends without a result", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/builtin-agents/lead_research/invoke`, () => {
        const body = sseBody([
          { event: "update", data: { type: "status", text: "Starting" } },
        ]);
        return new HttpResponse(body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    await expect(
      client().builtinAgents.invokeStream("lead_research", { input: {} }),
    ).rejects.toThrow("stream ended without a result event");
  });
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

describe("BuiltinAgents.sessions", () => {
  it("creates a session (POST /builtin-agents/sessions)", async () => {
    let captured: {
      method: string;
      url: string;
      body: Record<string, unknown>;
    } | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/sessions`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json(sampleSession);
        },
      ),
    );

    const res = await client().builtinAgents.sessions.create({
      agent: "market_intel",
      title: "Makati CBD",
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.body).toEqual({
      agent: "market_intel",
      title: "Makati CBD",
    });
    expect(res.id).toBe("sess-1");
    expect(res.agent).toBe("market_intel");
  });

  it("lists sessions with a limit (GET /builtin-agents/sessions?limit=N)", async () => {
    let captured: { url: string } | null = null;
    server.use(
      http.get(`${BASE_URL}/api/v1/builtin-agents/sessions`, ({ request }) => {
        captured = { url: request.url };
        return HttpResponse.json({ sessions: [sampleSession] });
      }),
    );

    const res = await client().builtinAgents.sessions.list({ limit: 5 });

    expect(captured).not.toBeNull();
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/sessions?limit=5`,
    );
    expect(res.sessions).toHaveLength(1);
  });

  it("gets one session with billed token totals", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/builtin-agents/sessions/sess-1`, () =>
        HttpResponse.json({
          ...sampleSession,
          billed_input_tokens: 1000,
          billed_output_tokens: 500,
          billed_cache_read_tokens: 50,
          billed_cache_creation_tokens: 20,
        }),
      ),
    );

    const res = await client().builtinAgents.sessions.get("sess-1");
    expect(res.id).toBe("sess-1");
    expect(res.billed_input_tokens).toBe(1000);
    expect(res.billed_cache_creation_tokens).toBe(20);
  });

  it("send() streams a turn and returns the ChatTurnResult", async () => {
    const turnResult = {
      reply: "Absorption is up 12% QoQ.",
      findings: { delta_pct: 12 },
      usage: {
        input_tokens: 20,
        output_tokens: 30,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
      turn_cost_usd: 0.01,
      running_seconds: 8.1,
    };
    let captured: { url: string; body: Record<string, unknown> } | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/sessions/sess-1/messages`,
        async ({ request }) => {
          captured = {
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          const body = sseBody([
            { event: "update", data: { type: "thinking", text: "comparing" } },
            { event: "result", data: turnResult },
          ]);
          return new HttpResponse(body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        },
      ),
    );

    const updates: BuiltinAgentUpdate[] = [];
    const res = await client().builtinAgents.sessions.send("sess-1", {
      text: "Compare to BGC",
      onUpdate: (u) => {
        updates.push(u);
      },
    });

    expect(captured).not.toBeNull();
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/sessions/sess-1/messages?stream=true`,
    );
    expect(captured!.body).toEqual({ text: "Compare to BGC" });
    expect(updates).toHaveLength(1);
    expect(res.reply).toBe("Absorption is up 12% QoQ.");
    expect(res.turn_cost_usd).toBe(0.01);
  });

  it("sendBlocking() POSTs with stream=false and returns JSON", async () => {
    const turnResult = {
      reply: "Done.",
      usage: {
        input_tokens: 1,
        output_tokens: 2,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
      turn_cost_usd: 0.001,
      running_seconds: 1.5,
    };
    let captured: { url: string; body: Record<string, unknown> } | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/sessions/sess-1/messages`,
        async ({ request }) => {
          captured = {
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json(turnResult);
        },
      ),
    );

    const res = await client().builtinAgents.sessions.sendBlocking("sess-1", {
      text: "Quick one",
    });

    expect(captured).not.toBeNull();
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/sessions/sess-1/messages?stream=false`,
    );
    expect(captured!.body).toEqual({ text: "Quick one" });
    expect(res.reply).toBe("Done.");
  });
});

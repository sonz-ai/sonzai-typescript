import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  Sonzai,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
  chunkPayload,
  DEFAULT_MAX_CHUNK_SIZE,
} from "../src/index.js";
import type { SSEChunkEnvelope } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

// ---------------------------------------------------------------------------
// Client Init
// ---------------------------------------------------------------------------

describe("Client Init", () => {
  it("throws without api key", () => {
    expect(() => new Sonzai({ apiKey: "" })).toThrow("apiKey must be provided");
  });

  it("creates client with api key", () => {
    const c = new Sonzai({ apiKey: "test-key" });
    expect(c.agents).toBeDefined();
    expect(c.evalTemplates).toBeDefined();
    expect(c.evalRuns).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

describe("Chat", () => {
  it("aggregates non-streaming chat", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        const body = [
          'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null,"index":0}]}',
          "",
          'data: {"choices":[{"delta":{"content":" world"},"finish_reason":"stop","index":0}],"usage":{"promptTokens":10,"completionTokens":5,"totalTokens":15}}',
          "",
          "data: [DONE]",
          "",
        ].join("\n");
        return new HttpResponse(body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const res = await client().agents.chat({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(res.content).toBe("Hello world");
    expect(res.usage?.totalTokens).toBe(15);
  });

  it("streams chat events", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        const body = [
          'data: {"choices":[{"delta":{"content":"Hi"},"finish_reason":null,"index":0}]}',
          "",
          'data: {"choices":[{"delta":{"content":"!"},"finish_reason":"stop","index":0}]}',
          "",
          "data: [DONE]",
          "",
        ].join("\n");
        return new HttpResponse(body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const events = [];
    for await (const event of client().agents.chatStream({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]?.choices?.[0]?.delta?.content).toBe("Hi");
    expect(events[1]?.choices?.[0]?.finish_reason).toBe("stop");
  });
});

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

describe("Memory", () => {
  it("lists memory nodes", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/memory`, () => {
        return HttpResponse.json({
          nodes: [{ node_id: "n1", title: "Favorites", importance: 0.8 }],
          contents: {},
        });
      }),
    );

    const res = await client().agents.memory.list("agent-1");
    expect(res.nodes).toHaveLength(1);
    expect(res.nodes[0]?.node_id).toBe("n1");
  });

  it("searches memories", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/memory/search`, () => {
        return HttpResponse.json({
          results: [
            { fact_id: "f1", content: "Likes pizza", fact_type: "preference", score: 0.95 },
          ],
        });
      }),
    );

    const res = await client().agents.memory.search("agent-1", {
      query: "food",
    });
    expect(res.results).toHaveLength(1);
    expect(res.results[0]?.content).toBe("Likes pizza");
  });

  it("gets memory timeline", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/memory/timeline`, () => {
        return HttpResponse.json({
          sessions: [{ session_id: "s1", facts: [], fact_count: 5 }],
          total_facts: 5,
        });
      }),
    );

    const res = await client().agents.memory.timeline("agent-1");
    expect(res.total_facts).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Personality
// ---------------------------------------------------------------------------

describe("Personality", () => {
  it("gets personality profile", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/personality`, () => {
        return HttpResponse.json({
          profile: {
            agent_id: "agent-1",
            name: "Luna",
            big5: {
              openness: { score: 0.8, percentile: 85 },
              conscientiousness: { score: 0.6, percentile: 60 },
              extraversion: { score: 0.7, percentile: 70 },
              agreeableness: { score: 0.9, percentile: 95 },
              neuroticism: { score: 0.3, percentile: 25 },
            },
          },
          evolution: [],
        });
      }),
    );

    const res = await client().agents.personality.get("agent-1");
    expect(res.profile.name).toBe("Luna");
    expect(res.profile.big5.openness.score).toBe(0.8);
  });
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

describe("Sessions", () => {
  it("starts a session", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/sessions/start`, () => {
        return HttpResponse.json({ success: true });
      }),
    );

    const res = await client().agents.sessions.start("agent-1", {
      userId: "user-1",
      sessionId: "sess-1",
    });
    expect(res.success).toBe(true);
  });

  it("ends a session", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/sessions/end`, () => {
        return HttpResponse.json({ success: true });
      }),
    );

    const res = await client().agents.sessions.end("agent-1", {
      userId: "user-1",
      sessionId: "sess-1",
      totalMessages: 10,
      durationSeconds: 300,
    });
    expect(res.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------

describe("Instances", () => {
  it("lists instances", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/instances`, () => {
        return HttpResponse.json({
          instances: [
            {
              instance_id: "inst-1",
              agent_id: "agent-1",
              name: "Default",
              status: "active",
              is_default: true,
            },
          ],
        });
      }),
    );

    const res = await client().agents.instances.list("agent-1");
    expect(res.instances).toHaveLength(1);
    expect(res.instances[0]?.name).toBe("Default");
  });

  it("creates an instance", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/instances`, () => {
        return HttpResponse.json(
          {
            instance_id: "inst-2",
            agent_id: "agent-1",
            name: "Test",
            status: "active",
            is_default: false,
          },
          { status: 201 },
        );
      }),
    );

    const res = await client().agents.instances.create("agent-1", {
      name: "Test",
    });
    expect(res.instance_id).toBe("inst-2");
  });
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

describe("Notifications", () => {
  it("lists notifications", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/notifications`, () => {
        return HttpResponse.json({
          notifications: [
            {
              message_id: "msg-1",
              agent_id: "agent-1",
              generated_message: "Hey there!",
              status: "pending",
            },
          ],
        });
      }),
    );

    const res = await client().agents.notifications.list("agent-1");
    expect(res.notifications).toHaveLength(1);
    expect(res.notifications[0]?.generated_message).toBe("Hey there!");
  });

  it("consumes a notification", async () => {
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/notifications/msg-1/consume`,
        () => {
          return HttpResponse.json({ success: true });
        },
      ),
    );

    const res = await client().agents.notifications.consume("agent-1", "msg-1");
    expect(res.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

describe("Events", () => {
  it("sends messages array when provided (TD-SDK-009)", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/events`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ accepted: true, event_id: "evt-1" });
      }),
    );

    const res = await client().agents.triggerBackendEvent("agent-1", {
      userId: "user-1",
      eventType: "daily_summary",
      messages: [
        { role: "user", content: "Hi there" },
        { role: "assistant", content: "Hello!" },
      ],
    });

    expect(res.accepted).toBe(true);
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.user_id).toBe("user-1");
    expect(capturedBody!.event_type).toBe("daily_summary");
    expect(capturedBody!.messages).toEqual([
      { role: "user", content: "Hi there" },
      { role: "assistant", content: "Hello!" },
    ]);
  });

  it("omits messages when undefined (back-compat)", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/events`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ accepted: true, event_id: "evt-2" });
      }),
    );

    const res = await client().agents.triggerBackendEvent("agent-1", {
      userId: "user-1",
      eventType: "cron_daily",
    });

    expect(res.accepted).toBe(true);
    expect(capturedBody).not.toBeNull();
    expect("messages" in (capturedBody as object)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Eval Templates
// ---------------------------------------------------------------------------

describe("EvalTemplates", () => {
  it("lists templates", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/eval-templates`, () => {
        return HttpResponse.json({
          templates: [
            { id: "tpl-1", name: "Quality Check", scoring_rubric: "Be helpful" },
          ],
        });
      }),
    );

    const res = await client().evalTemplates.list();
    expect(res.templates).toHaveLength(1);
    expect(res.templates[0]?.name).toBe("Quality Check");
  });

  it("creates a template", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/eval-templates`, () => {
        return HttpResponse.json(
          { id: "tpl-2", name: "New Template", scoring_rubric: "Score well" },
          { status: 201 },
        );
      }),
    );

    const res = await client().evalTemplates.create({
      name: "New Template",
      scoringRubric: "Score well",
    });
    expect(res.id).toBe("tpl-2");
  });
});

// ---------------------------------------------------------------------------
// Eval Runs
// ---------------------------------------------------------------------------

describe("EvalRuns", () => {
  it("lists runs", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/eval-runs`, () => {
        return HttpResponse.json({
          runs: [
            { id: "run-1", agent_id: "agent-1", status: "completed", total_turns: 20 },
          ],
          total_count: 1,
        });
      }),
    );

    const res = await client().evalRuns.list();
    expect(res.runs).toHaveLength(1);
    expect(res.runs[0]?.status).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe("Error Handling", () => {
  it("throws AuthenticationError on 401", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/memory`, () => {
        return HttpResponse.json({ error: "Invalid API key" }, { status: 401 });
      }),
    );

    await expect(client().agents.memory.list("agent-1")).rejects.toThrow(
      AuthenticationError,
    );
  });

  it("throws NotFoundError on 404", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/bad-id/personality`, () => {
        return HttpResponse.json({ error: "Agent not found" }, { status: 404 });
      }),
    );

    await expect(client().agents.personality.get("bad-id")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws BadRequestError on 400", async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/agents/agent-1/memory`, () => {
        return HttpResponse.json(
          { error: "invalid limit" },
          { status: 400 },
        );
      }),
    );

    await expect(client().agents.memory.list("agent-1")).rejects.toThrow(
      BadRequestError,
    );
  });
});

// ---------------------------------------------------------------------------
// SSE Chunked Events — chunkPayload producer
// ---------------------------------------------------------------------------

describe("chunkPayload", () => {
  it("returns a single un-enveloped frame for small payloads", () => {
    const payload = { greeting: "hello" };
    const frames = chunkPayload(payload);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toBe(`data: ${JSON.stringify(payload)}\n\n`);
    // Should NOT contain __chunk
    expect(frames[0]).not.toContain("__chunk");
  });

  it("splits large payloads into chunk-enveloped frames", () => {
    // Create a payload larger than 64 bytes to force chunking at a small limit
    const payload = { big: "x".repeat(200) };
    const frames = chunkPayload(payload, 64);
    expect(frames.length).toBeGreaterThan(1);

    // Each frame should be a valid SSE data line with __chunk envelope
    for (const frame of frames) {
      expect(frame).toMatch(/^data: .+\n\n$/);
      const parsed = JSON.parse(frame.slice(6, -2)) as SSEChunkEnvelope;
      expect(parsed.__chunk).toBeDefined();
      expect(typeof parsed.__chunk.index).toBe("number");
      expect(typeof parsed.__chunk.total).toBe("number");
      expect(parsed.__chunk.total).toBe(frames.length);
      expect(typeof parsed.data).toBe("string");
    }

    // Reassemble and verify roundtrip
    const reassembled = frames
      .map((f) => JSON.parse(f.slice(6, -2)) as SSEChunkEnvelope)
      .sort((a, b) => a.__chunk.index - b.__chunk.index)
      .map((e) => e.data)
      .join("");
    expect(JSON.parse(reassembled)).toEqual(payload);
  });

  it("uses DEFAULT_MAX_CHUNK_SIZE when no limit is specified", () => {
    expect(DEFAULT_MAX_CHUNK_SIZE).toBe(256 * 1024);
    // A small payload with the default limit should not chunk
    const frames = chunkPayload({ a: 1 });
    expect(frames).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// SSE Chunked Events — streamSSE reassembly
// ---------------------------------------------------------------------------

describe("SSE Chunked Reassembly", () => {
  it("reassembles chunked events into a single yielded object", async () => {
    const original = {
      choices: [{ delta: { content: "Hello world" }, finish_reason: "stop", index: 0 }],
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    };
    const json = JSON.stringify(original);
    // Split into 3 chunks manually
    const chunkSize = Math.ceil(json.length / 3);
    const chunks = [
      json.slice(0, chunkSize),
      json.slice(chunkSize, chunkSize * 2),
      json.slice(chunkSize * 2),
    ];

    const sseBody = chunks
      .map((data, i) =>
        `data: ${JSON.stringify({ __chunk: { index: i, total: 3 }, data })}\n`,
      )
      .join("\n")
      + "\ndata: [DONE]\n\n";

    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(sseBody, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const events: Record<string, unknown>[] = [];
    for await (const event of client().agents.chatStream({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    })) {
      events.push(event as Record<string, unknown>);
    }

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(original);
  });

  it("passes non-chunked events through unchanged", async () => {
    const body = [
      'data: {"choices":[{"delta":{"content":"Hi"},"finish_reason":null,"index":0}]}',
      "",
      'data: {"choices":[{"delta":{"content":"!"},"finish_reason":"stop","index":0}]}',
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const events: Record<string, unknown>[] = [];
    for await (const event of client().agents.chatStream({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    })) {
      events.push(event as Record<string, unknown>);
    }

    expect(events).toHaveLength(2);
  });

  it("handles mixed chunked and normal events", async () => {
    // Normal event first, then a chunked event, then another normal event
    const normalEvent1 = { choices: [{ delta: { content: "A" }, finish_reason: null, index: 0 }] };
    const largePayload = {
      choices: [{ delta: { content: "Large content here" }, finish_reason: null, index: 0 }],
      extra: "x".repeat(100),
    };
    const normalEvent2 = { choices: [{ delta: { content: "B" }, finish_reason: "stop", index: 0 }] };

    const largeJson = JSON.stringify(largePayload);
    const mid = Math.ceil(largeJson.length / 2);
    const chunk0 = largeJson.slice(0, mid);
    const chunk1 = largeJson.slice(mid);

    const sseBody = [
      `data: ${JSON.stringify(normalEvent1)}`,
      "",
      `data: ${JSON.stringify({ __chunk: { index: 0, total: 2 }, data: chunk0 })}`,
      "",
      `data: ${JSON.stringify({ __chunk: { index: 1, total: 2 }, data: chunk1 })}`,
      "",
      `data: ${JSON.stringify(normalEvent2)}`,
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(sseBody, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const events: Record<string, unknown>[] = [];
    for await (const event of client().agents.chatStream({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    })) {
      events.push(event as Record<string, unknown>);
    }

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual(normalEvent1);
    expect(events[1]).toEqual(largePayload);
    expect(events[2]).toEqual(normalEvent2);
  });

  it("roundtrips chunkPayload -> streamSSE reassembly", async () => {
    const original = {
      choices: [{ delta: { content: "a]b".repeat(100) }, finish_reason: "stop", index: 0 }],
      usage: { promptTokens: 50, completionTokens: 300, totalTokens: 350 },
    };

    // Produce chunked frames via chunkPayload with a small limit
    const frames = chunkPayload(original, 64);
    expect(frames.length).toBeGreaterThan(1); // confirm it actually chunked

    // Build SSE body from the frames (each frame is already "data: ...\n\n")
    const sseBody = frames.join("") + "data: [DONE]\n\n";

    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(sseBody, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const events: Record<string, unknown>[] = [];
    for await (const event of client().agents.chatStream({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    })) {
      events.push(event as Record<string, unknown>);
    }

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(original);
  });
});

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  Sonzai,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
} from "../src/index.js";

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
        const encoder = new TextEncoder();
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(
              [
                'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null,"index":0}]}',
                "",
                'data: {"choices":[{"delta":{"content":" world"},"finish_reason":"stop","index":0}],"usage":{"promptTokens":10,"completionTokens":5,"totalTokens":15}}',
                "",
                "data: [DONE]",
                "",
              ].join("\n"),
            ));
            controller.close();
          },
        });
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
        const encoder = new TextEncoder();
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(
              [
                'data: {"choices":[{"delta":{"content":"Hi"},"finish_reason":null,"index":0}]}',
                "",
                'data: {"choices":[{"delta":{"content":"!"},"finish_reason":"stop","index":0}]}',
                "",
                "data: [DONE]",
                "",
              ].join("\n"),
            ));
            controller.close();
          },
        });
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

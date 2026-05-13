import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Sonzai } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps an array of SSE event objects into the wire body the SDK expects. */
function sseBody(events: Array<Record<string, unknown>>): string {
  const lines: string[] = [];
  for (const event of events) {
    lines.push(`data: ${JSON.stringify(event)}`);
    lines.push("");
  }
  lines.push("data: [DONE]");
  lines.push("");
  return lines.join("\n");
}

/** Drives a slow SSE response where each chunk arrives after a tick. */
function slowSseResponse(events: Array<Record<string, unknown>>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        // Yield control so the consumer can interleave aborts/listeners.
        await new Promise((r) => setTimeout(r, 5));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

// ---------------------------------------------------------------------------
// chatDetached (non-streaming aggregator)
// ---------------------------------------------------------------------------

describe("chatDetached", () => {
  it("aggregates SSE deltas like chat()", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(
          sseBody([
            {
              choices: [
                { delta: { content: "Detached " }, index: 0, finish_reason: null },
              ],
            },
            {
              choices: [
                { delta: { content: "hello" }, index: 0, finish_reason: "stop" },
              ],
              usage: {
                promptTokens: 4,
                completionTokens: 2,
                totalTokens: 6,
              },
            },
          ]),
          { headers: { "Content-Type": "text/event-stream" } },
        );
      }),
    );

    const res = await client().agents.chatDetached({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(res.content).toBe("Detached hello");
    expect(res.usage?.totalTokens).toBe(6);
  });

  it("continues running after parentSignal.abort() and fires onParentCancel once", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return slowSseResponse([
          {
            choices: [
              { delta: { content: "A" }, index: 0, finish_reason: null },
            ],
          },
          {
            choices: [
              { delta: { content: "B" }, index: 0, finish_reason: null },
            ],
          },
          {
            choices: [
              { delta: { content: "C" }, index: 0, finish_reason: "stop" },
            ],
          },
        ]);
      }),
    );

    const parent = new AbortController();
    const onParentCancel = vi.fn();

    const pending = client().agents.chatDetached(
      {
        agent: "agent-1",
        messages: [{ role: "user", content: "Hi" }],
      },
      { parentSignal: parent.signal, onParentCancel },
    );

    // Fire the parent abort while the SSE stream is still in flight.
    setTimeout(() => parent.abort(), 1);

    const res = await pending;

    expect(res.content).toBe("ABC");
    expect(onParentCancel).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// chatStreamDetached (callback variant)
// ---------------------------------------------------------------------------

describe("chatStreamDetached", () => {
  it("invokes the callback for every event", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(
          sseBody([
            {
              choices: [
                { delta: { content: "One" }, index: 0, finish_reason: null },
              ],
            },
            {
              choices: [
                { delta: { content: "Two" }, index: 0, finish_reason: "stop" },
              ],
            },
          ]),
          { headers: { "Content-Type": "text/event-stream" } },
        );
      }),
    );

    const collected: string[] = [];
    await client().agents.chatStreamDetached(
      { agent: "agent-1", messages: [{ role: "user", content: "Hi" }] },
      (event) => {
        const c = event.choices?.[0]?.delta?.content;
        if (c) collected.push(c);
      },
    );

    expect(collected).toEqual(["One", "Two"]);
  });
});

// ---------------------------------------------------------------------------
// chatStreamChannelDetached (AsyncIterableIterator variant)
// ---------------------------------------------------------------------------

describe("chatStreamChannelDetached", () => {
  it("continues iterating after parent.abort()", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return slowSseResponse([
          {
            choices: [{ delta: { content: "x" }, index: 0, finish_reason: null }],
          },
          {
            choices: [{ delta: { content: "y" }, index: 0, finish_reason: null }],
          },
          {
            choices: [{ delta: { content: "z" }, index: 0, finish_reason: "stop" }],
          },
        ]);
      }),
    );

    const parent = new AbortController();
    // Silent logger so the default console.warn doesn't pollute test output —
    // the assertion is the iterator continues, not the warning shape.
    const silent = { warn: () => {} };
    const iter = client().agents.chatStreamChannelDetached(
      { agent: "agent-1", messages: [{ role: "user", content: "Hi" }] },
      { parentSignal: parent.signal, logger: silent },
    );

    const collected: string[] = [];
    let aborted = false;
    for await (const event of iter) {
      const c = event.choices?.[0]?.delta?.content;
      if (c) {
        collected.push(c);
        if (!aborted) {
          // Cancel the parent partway through; the iterator must
          // keep yielding because the inner controller is detached.
          parent.abort();
          aborted = true;
        }
      }
    }

    expect(collected).toEqual(["x", "y", "z"]);
  });

  it("fires onParentCancel exactly once even if parent.abort() is called multiple times", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return slowSseResponse([
          { choices: [{ delta: { content: "1" }, index: 0, finish_reason: null }] },
          { choices: [{ delta: { content: "2" }, index: 0, finish_reason: "stop" }] },
        ]);
      }),
    );

    const parent = new AbortController();
    const onParentCancel = vi.fn();
    const iter = client().agents.chatStreamChannelDetached(
      { agent: "agent-1", messages: [{ role: "user", content: "Hi" }] },
      { parentSignal: parent.signal, onParentCancel },
    );

    // Abort, then abort again — AbortController.abort() is idempotent
    // but we want to assert that our addEventListener({ once: true })
    // wiring means we never double-fire.
    setTimeout(() => {
      parent.abort();
      parent.abort();
    }, 1);

    for await (const _ of iter) {
      // drain
    }

    expect(onParentCancel).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onParentCancel when parent never aborts", async () => {
    server.use(
      http.post(`${BASE_URL}/api/v1/agents/agent-1/chat`, () => {
        return new HttpResponse(
          sseBody([
            {
              choices: [
                { delta: { content: "ok" }, index: 0, finish_reason: "stop" },
              ],
            },
          ]),
          { headers: { "Content-Type": "text/event-stream" } },
        );
      }),
    );

    const parent = new AbortController();
    const onParentCancel = vi.fn();
    const iter = client().agents.chatStreamChannelDetached(
      { agent: "agent-1", messages: [{ role: "user", content: "Hi" }] },
      { parentSignal: parent.signal, onParentCancel },
    );

    for await (const _ of iter) {
      // drain
    }

    expect(onParentCancel).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// temperature plumbing
// ---------------------------------------------------------------------------

describe("ChatOptions.temperature", () => {
  it("omits temperature from the request body when undefined", async () => {
    let captured: Record<string, unknown> | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/chat`,
        async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(
            sseBody([
              {
                choices: [
                  { delta: { content: "ok" }, index: 0, finish_reason: "stop" },
                ],
              },
            ]),
            { headers: { "Content-Type": "text/event-stream" } },
          );
        },
      ),
    );

    await client().agents.chat({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(captured).toBeDefined();
    expect(captured && "temperature" in captured).toBe(false);
  });

  it("includes temperature in the request body when set", async () => {
    let captured: Record<string, unknown> | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/chat`,
        async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(
            sseBody([
              {
                choices: [
                  { delta: { content: "ok" }, index: 0, finish_reason: "stop" },
                ],
              },
            ]),
            { headers: { "Content-Type": "text/event-stream" } },
          );
        },
      ),
    );

    await client().agents.chat({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
      temperature: 0.7,
    });

    expect(captured?.temperature).toBe(0.7);
  });

  it("forwards temperature: 0 as an explicit zero (not stripped)", async () => {
    let captured: Record<string, unknown> | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/chat`,
        async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(
            sseBody([
              {
                choices: [
                  { delta: { content: "ok" }, index: 0, finish_reason: "stop" },
                ],
              },
            ]),
            { headers: { "Content-Type": "text/event-stream" } },
          );
        },
      ),
    );

    await client().agents.chat({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
      temperature: 0,
    });

    expect(captured?.temperature).toBe(0);
  });

  it("forwards temperature through the detached variant too", async () => {
    let captured: Record<string, unknown> | undefined;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/agents/agent-1/chat`,
        async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(
            sseBody([
              {
                choices: [
                  { delta: { content: "ok" }, index: 0, finish_reason: "stop" },
                ],
              },
            ]),
            { headers: { "Content-Type": "text/event-stream" } },
          );
        },
      ),
    );

    await client().agents.chatDetached({
      agent: "agent-1",
      messages: [{ role: "user", content: "Hi" }],
      temperature: 1,
    });

    expect(captured?.temperature).toBe(1);
  });
});

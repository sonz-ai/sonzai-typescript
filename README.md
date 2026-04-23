# Sonzai TypeScript SDK

[![npm version](https://img.shields.io/npm/v/@sonzai-labs/agents.svg)](https://www.npmjs.com/package/@sonzai-labs/agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official TypeScript SDK for the [Sonzai Mind Layer API](https://sonz.ai). Build AI agents with persistent memory, evolving personality, and proactive behaviors.

**Zero runtime dependencies.** Uses the native `fetch` API. Works with Node.js (>=18), Bun, and Deno. Ships both ESM and CJS builds with full type definitions.

## Installation

```bash
npm install @sonzai-labs/agents
# or:
bun add @sonzai-labs/agents
pnpm add @sonzai-labs/agents

# Deno:
import { Sonzai } from "npm:@sonzai-labs/agents";
```

## Quick Start

```ts
import { Sonzai } from "@sonzai-labs/agents";

const client = new Sonzai({ apiKey: "your-api-key" }); // or set SONZAI_API_KEY

const response = await client.agents.chat({
  agent: "your-agent-id",
  messages: [{ role: "user", content: "Hello! What's your favorite hobby?" }],
  userId: "user-123",
});
console.log(response.content);
```

## Authentication

Get your API key from the [Sonzai Dashboard](https://platform.sonz.ai) under **Projects > API Keys**.

```ts
const client = new Sonzai({ apiKey: "sk-..." });  // explicit
const client = new Sonzai();                      // or: SONZAI_API_KEY=sk-...
```

API keys are sent as `Authorization: Bearer <key>`.

## Configuration

```ts
const client = new Sonzai({
  apiKey: "sk-...",              // or SONZAI_API_KEY env var
  baseUrl: "https://api.sonz.ai", // or SONZAI_BASE_URL env var
  timeout: 30_000,               // request timeout (ms)
  maxRetries: 2,                 // retries for idempotent failures
  defaultHeaders: { "X-My": "hdr" },
  customFetch: fetch,            // swap in undici / a mock / a wrapper
});
```

Idempotent requests (GET, DELETE) retry with exponential backoff on transient failures. Mutating requests (POST, PATCH, PUT) do not retry.

## Resources

```ts
client.agents             // chat, CRUD, dialogue, context engine
client.knowledge          // project-scoped KB (docs, graph, facts, search)
client.evalTemplates      // evaluation templates
client.evalRuns           // eval/simulation runs, reconnectable streaming
client.voices             // global voice catalog
client.webhooks           // webhook registration and rotation
client.projects           // project management & API keys
client.userPersonas       // user persona CRUD
client.analytics          // cost, usage, real-time analytics
client.workbench          // internal simulation & time-machine
client.projectConfig      // project-scoped config
client.accountConfig      // tenant-scoped config
client.customLLM          // bring-your-own-model (BYOM)
client.projectNotifications
```

Agent sub-resources:

```ts
client.agents.memory           // tree, search, facts, timeline
client.agents.personality      // Big5, dimensions, deltas, overlays
client.agents.sessions         // start / end
client.agents.instances        // parallel instances
client.agents.notifications    // proactive notifications
client.agents.customStates     // scoped key-value state
client.agents.voice            // TTS / STT / live WebSocket
client.agents.generation       // bio, character, seed memory
client.agents.priming          // batch import / user priming
client.agents.inventory        // user inventory
client.agents.schedules        // user-scoped recurring events
```

## Usage

### Chat (non-streaming)

```ts
const response = await client.agents.chat({
  agent: "agent-id",
  messages: [{ role: "user", content: "Hello!" }],
  userId: "user-123",
  sessionId: "session-456",          // auto-created if omitted
  provider: "gemini",                 // gemini | zhipu | volcengine | openrouter | custom
  model: "gemini-3.1-flash-lite-preview",
});
console.log(response.content);
console.log(`Tokens: ${response.usage?.totalTokens}`);
```

### Chat (streaming)

```ts
for await (const event of client.agents.chatStream({
  agent: "agent-id",
  messages: [{ role: "user", content: "Tell me a story" }],
})) {
  const delta = event.choices?.[0]?.delta?.content ?? "";
  process.stdout.write(delta);
}
```

Streams return an `AsyncGenerator<ChatStreamEvent>`. Each event carries a delta in `choices[0].delta.content`, plus optional `usage` on the final frame.

### Sync vs async memory recall (`memoryMode`)

Supplementary memory recall can run **synchronously** (blocks context build until recall completes — every fact lands in the current turn) or **asynchronously** (races a deadline — slow hits spill to the next turn for lower first-token latency). Default is `sync`.

`memoryMode` is an agent-wide capability. You can set it at creation time or flip it later with `updateCapabilities`:

```ts
// At creation
await client.agents.create({
  name: "Luna",
  toolCapabilities: { memory_mode: "async" },
});

// Or flip an existing agent
const caps = await client.agents.updateCapabilities("agent-id", {
  memoryMode: "async",   // or "sync"
});

// Read the current mode
const current = await client.agents.getCapabilities("agent-id");
console.log(current.memoryMode);
```

`updateCapabilities` is PATCH-style — omitted fields are left unchanged. To skip the context engine entirely on a single chat (e.g. test paths), set `skipContextBuild: true` in the chat options.

### Advanced chat options

```ts
await client.agents.chat({
  agent: "agent-id",
  messages: [...],
  userId: "user-123",
  userDisplayName: "Alex",
  instanceId: "instance-789",          // parallel branch
  sessionId: "session-456",
  provider: "gemini",
  model: "gemini-3.1-flash-lite-preview",
  language: "en",
  timezone: "America/New_York",
  compiledSystemPrompt: "You are a helpful assistant.",
  toolCapabilities: { web_search: true, remember_name: true },
  toolDefinitions: [
    {
      name: "get_weather",
      description: "Get current weather",
      parameters: { type: "object", properties: { city: { type: "string" } } },
    },
  ],
  maxTurns: 10,
  skipContextBuild: false,
  gameContext: { custom_fields: { /* ... */ } },
  skillLevels: { negotiation: 5 },
});
```

### Provider constants

```ts
import { Sonzai, providers } from "@sonzai-labs/agents";

await client.agents.chat({
  agent: "agent-id",
  messages: [...],
  provider: providers.GEMINI,
  model: providers.models.gemini.FLASH_LITE,
});
```

### Agent CRUD

```ts
const agent = await client.agents.create({
  name: "Luna",
  gender: "female",
  bio: "A thoughtful AI companion",
  personalityPrompt: "You are warm and empathetic",
  big5: { openness: 0.85, conscientiousness: 0.6 },
  // Tool capabilities are configurable at creation time:
  toolCapabilities: {
    web_search: true,
    remember_name: true,
    image_generation: false,
    inventory: false,
    knowledge_base: true,     // enable project-scoped KB search
    memory_mode: "async",      // "sync" (default) or "async"
  },
});

await client.agents.get(agent.agentId);
await client.agents.update(agent.agentId, { name: "New Name" });
await client.agents.list({ pageSize: 20, search: "luna" });
await client.agents.delete(agent.agentId);
```

### Memory

```ts
// Tree
const memory = await client.agents.memory.list("agent-id", {
  userId: "user-123",
  includeContents: true,
  limit: 100,
});
for (const node of memory.nodes) {
  console.log(`${node.title}: ${node.summary} (importance: ${node.importance})`);
}

// Semantic search (cosine embeddings when user_id is set, BM25 otherwise)
const results = await client.agents.memory.search("agent-id", {
  query: "favorite food",
  user_id: "user-123",
  limit: 20,
});

// Timeline
const timeline = await client.agents.memory.timeline("agent-id", {
  userId: "user-123",
  start: "2026-01-01",
  end: "2026-03-01",
});

// Fact CRUD
const fact = await client.agents.memory.createFact("agent-id", {
  content: "Likes pizza",
  factType: "preference",
  importance: 0.8,
  userId: "user-123",
});
await client.agents.memory.updateFact("agent-id", fact.factId, { importance: 0.9 });
await client.agents.memory.getFactHistory("agent-id", fact.factId);
await client.agents.memory.deleteFact("agent-id", fact.factId);

// Wisdom (agent-global) facts
await client.agents.memory.getWisdomAudit("agent-id", fact.factId);
await client.agents.memory.deleteWisdomFact("agent-id", fact.factId);

// Bulk create up to 1000 pre-formed facts in a single request.
// source_type="manual" — no LLM extraction.
await client.agents.memory.bulkCreateFacts("agent-id", {
  userId: "user-123",
  facts: [
    { content: "prefers espresso" },
    { content: "based in Singapore", factType: "location" },
  ],
});

// Seed / reset
await client.agents.memory.seed("agent-id", {
  userId: "user-123",
  memories: [{ atomic_text: "User is a chess enthusiast", fact_type: "interest" }],
});
await client.agents.memory.reset("agent-id", { userId: "user-123" });

// Paginated fact listing
const facts = await client.agents.memory.listFacts("agent-id", { limit: 50, offset: 0 });
```

### Personality

```ts
const profile = await client.agents.personality.get("agent-id");
console.log(profile.profile.name);
console.log(profile.profile.big5.openness.score);
console.log(profile.profile.dimensions.warmth);

// Recent shifts and significant moments
const shifts = await client.agents.personality.getRecentShifts("agent-id");
const moments = await client.agents.personality.getSignificantMoments("agent-id", { limit: 10 });

// Per-user overlays (how the agent perceives a specific user)
const overlays = await client.agents.personality.listUserOverlays("agent-id");
const overlay = await client.agents.personality.getUserOverlay("agent-id", "user-123");
```

### Sessions & instances

```ts
await client.agents.sessions.start("agent-id", {
  userId: "user-123",
  sessionId: "session-456",
});
await client.agents.sessions.end("agent-id", {
  userId: "user-123",
  sessionId: "session-456",
  totalMessages: 10,
  durationSeconds: 300,
});

// Parallel agent instances
const instances = await client.agents.instances.list("agent-id");
const instance = await client.agents.instances.create("agent-id", { name: "Beta" });
await client.agents.instances.reset("agent-id", instance.instance_id);
await client.agents.instances.delete("agent-id", instance.instance_id);
```

### Context engine state

```ts
// Single-call enriched context — fact retrieval runs query-conditioned
// (two-pass: entity-filtered + raw-text vector), and recent_turns surfaces
// this session's raw messages before consolidation has run.
const ctx = await client.agents.getContext("agent-id", {
  userId: "user-123",
  query: "what did we discuss earlier about espresso?",
});
for (const turn of ctx.recent_turns ?? []) {
  console.log(`[${turn.timestamp}] ${turn.role}: ${turn.content}`);
}

// Individual layer accessors (the single getContext call above pulls all of these)
await client.agents.getMood("agent-id", { userId: "user-123" });
await client.agents.getRelationships("agent-id");
await client.agents.getHabits("agent-id");
await client.agents.getGoals("agent-id");
await client.agents.getInterests("agent-id");
await client.agents.getDiary("agent-id");
await client.agents.getUsers("agent-id");
await client.agents.getBreakthroughs("agent-id");
await client.agents.getTimeMachine("agent-id", "2026-01-15T00:00:00Z");
```

### Notifications

```ts
const pending = await client.agents.notifications.list("agent-id", {
  status: "pending",
  userId: "user-123",
  limit: 20,
});
for (const n of pending.notifications) {
  console.log(`[${n.check_type}] ${n.generated_message}`);
}

await client.agents.notifications.consume("agent-id", pending.notifications[0].message_id);
await client.agents.notifications.history("agent-id", { limit: 50 });
```

### Custom states

```ts
const state = await client.agents.customStates.create("agent-id", {
  key: "player_level",
  value: { level: 15, xp: 2400 },
  scope: "user",          // or "global"
  contentType: "json",
  userId: "user-123",
});

await client.agents.customStates.upsert("agent-id", {
  key: "player_level",
  value: { level: 16 },
  scope: "user",
  userId: "user-123",
});

await client.agents.customStates.getByKey("agent-id", {
  key: "player_level", scope: "user", userId: "user-123",
});
await client.agents.customStates.deleteByKey("agent-id", {
  key: "player_level", scope: "user", userId: "user-123",
});
await client.agents.customStates.list("agent-id", { scope: "global", limit: 50 });
```

### Knowledge base

```ts
// Documents
await client.knowledge.uploadDocument("project-id", "document.pdf", fileData);
const docs = await client.knowledge.listDocuments("project-id", 10);
await client.knowledge.getDocument("project-id", "doc-id");
await client.knowledge.deleteDocument("project-id", "doc-id");

// Structured facts
await client.knowledge.insertFacts("project-id", {
  entities: [...],
  relationships: [...],
});

// Graph nodes
const nodes = await client.knowledge.listNodes("project-id", { type: "Person", limit: 100, offset: 0 });
await client.knowledge.getNode("project-id", "node-id");
await client.knowledge.deleteNode("project-id", "node-id");

// Semantic search
const results = await client.knowledge.search("project-id", {
  query: "what is the user's favorite food?",
  limit: 10,
});
for (const r of results.results) {
  console.log(`[${r.score.toFixed(2)}] ${r.label} (${r.type})`);
}
```

### Voice (TTS / STT / live)

```ts
// Text-to-Speech
const tts = await client.agents.voice.tts("agent-id", {
  text: "Hello, how are you?",
  voiceName: "Kore",
  language: "en-US",
});
const audioBytes = Buffer.from(tts.audio, "base64");

// Speech-to-Text
const stt = await client.agents.voice.stt("agent-id", {
  audio: pcmBuffer.toString("base64"),
  audioFormat: "pcm",
  language: "en-US",
});
console.log(stt.transcript);

// Live bidirectional voice (WebSocket, Gemini Live)
const token = await client.agents.voice.getToken("agent-id", {
  voiceName: "Kore",
  language: "en-US",
  userId: "user-123",
});
const stream = await client.agents.voice.stream(token);

stream.sendText("Hello!");
// or: stream.sendAudio(pcm16kHzMonoBytes);

for await (const event of stream) {
  if (event.type === "input_transcript") console.log("User:", event.text);
  if (event.type === "output_transcript") console.log("Agent:", event.text);
  if (event.type === "audio") playPCM(event.audio);   // 24 kHz PCM
  if (event.type === "session_ended") break;
}

stream.close();
```

### Evaluation & simulation

```ts
// One-off evaluation
const result = await client.agents.evaluate("agent-id", {
  messages: [
    { role: "user", content: "I'm feeling sad today" },
    { role: "assistant", content: "I'm sorry to hear that..." },
  ],
  templateId: "template-uuid",
});
console.log(result.score, result.feedback);

// Streaming simulation
for await (const event of client.agents.simulate("agent-id", {
  userPersona: { name: "Alex", background: "College student" },
  config: { max_sessions: 3, max_turns_per_session: 10 },
})) {
  console.log(`[${event.type}] ${event.message}`);
}

// Fire-and-forget — returns RunRef, reconnect later
const ref = await client.agents.simulateAsync("agent-id", {
  userPersona: { name: "Alex" },
  config: { max_sessions: 2 },
});
for await (const event of client.evalRuns.streamEvents(ref.run_id, 0)) {
  console.log(`[${event.type}] ${event.message}`);
}

// Combined simulation + evaluation
for await (const event of client.agents.runEval("agent-id", {
  templateId: "template-uuid",
  userPersona: { name: "Alex" },
  simulationConfig: { max_sessions: 2 },
})) {
  console.log(`[${event.type}] ${event.message}`);
}

// Re-evaluate an existing run with a different template
for await (const event of client.agents.evalOnly("agent-id", {
  templateId: "new-template-uuid",
  sourceRunId: "existing-run-uuid",
})) {
  console.log(`[${event.type}] ${event.message}`);
}

// Templates & runs
await client.evalTemplates.list();
const template = await client.evalTemplates.create({
  name: "Empathy Check",
  scoringRubric: "...",
  categories: [
    { name: "Awareness", weight: 0.5, criteria: "..." },
    { name: "Response",  weight: 0.5, criteria: "..." },
  ],
});
await client.evalTemplates.update(template.id, { name: "v2" });
await client.evalTemplates.delete(template.id);

await client.evalRuns.list({ agentId: "agent-id", limit: 20, offset: 0 });
await client.evalRuns.get("run-id");
await client.evalRuns.delete("run-id");
```

### Webhooks

```ts
// Register / update
const resp = await client.webhooks.register("agent.message.created", {
  webhookUrl: "https://example.com/hook",
  authHeader: "Bearer your-secret",   // optional; added to delivery requests
});
console.log("signing secret:", resp.signing_secret);

// Inspect
await client.webhooks.list();
await client.webhooks.listDeliveryAttempts("agent.message.created");

// Rotate & delete
await client.webhooks.rotateSecret("agent.message.created");
await client.webhooks.delete("agent.message.created");

// Project-scoped variants
await client.webhooks.registerForProject("project-id", "agent.created", { webhookUrl });
await client.webhooks.listForProject("project-id");
await client.webhooks.deleteForProject("project-id", "agent.created");
```

Verify incoming webhooks on your endpoint with HMAC-SHA256 over the raw body using the `signing_secret` you received at registration:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

function verify(payload: Buffer, header: string, secret: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(header, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
```

### Platform models & analytics

```ts
const { providers, default_model } = await client.listModels();

await client.analytics.usage({ start: "2026-01-01", end: "2026-03-01" });
await client.analytics.costs({ projectId: "project-id" });
await client.analytics.realtime();

await client.workbench.advanceTime("agent-id", { hours: 24 });
```

## Error handling

```ts
import {
  Sonzai,
  SonzaiError,           // base class
  AuthenticationError,    // 401
  PermissionDeniedError,  // 403
  NotFoundError,          // 404
  BadRequestError,        // 400
  RateLimitError,         // 429 — has `retryAfter?: number` (ms)
  InternalServerError,    // 5xx
  APIError,               // generic, has `statusCode: number`
  StreamError,            // SSE / WebSocket streaming
} from "@sonzai-labs/agents";

try {
  const res = await client.agents.chat({ agent: "agent-id", messages: [...] });
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (err instanceof NotFoundError) {
    console.log("Agent not found");
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${err.retryAfter}ms`);
  } else if (err instanceof SonzaiError) {
    console.log(`API error: ${err.message}`);
  }
}
```

## Pagination

Two patterns are used depending on the endpoint:

```ts
// Cursor-based (agents list)
const page1 = await client.agents.list({ pageSize: 20 });
const page2 = await client.agents.list({ pageSize: 20, cursor: page1.next_cursor });

// Offset-based (most list endpoints)
const runs  = await client.evalRuns.list({ agentId: "agent-id", limit: 50, offset: 0 });
const facts = await client.agents.memory.listFacts("agent-id", { limit: 50, offset: 50 });
```

## Types

All request and response types are exported from the root entry point:

```ts
import type {
  SonzaiConfig,
  ChatMessage, ChatOptions, ChatResponse, ChatStreamEvent, ChatUsage,
  MemoryNode, AtomicFact, MemoryResponse,
  PersonalityProfile, Big5, PersonalityDimensions,
  SimulationEvent, EvalTemplate, EvalRun,
  // ...and many more
} from "@sonzai-labs/agents";
```

Most types are regenerated from the committed OpenAPI spec; a few SDK-specific options (`SonzaiConfig`, `ChatOptions`, streaming events) are hand-written.

## Runtime compatibility

| Runtime | Version | Status |
|---------|---------|--------|
| Node.js | ≥ 18    | Full support |
| Bun     | ≥ 1.0   | Full support |
| Deno    | ≥ 1.28  | Full support |

The SDK uses only the standard Web API (`fetch`, `ReadableStream`, `TextDecoder`, `URL`, `AbortController`) with no runtime-specific dependencies. Package ships both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) builds with matching type definitions.

## Benchmarks

Sonzai beats MemPalace on LongMemEval — the retrieval benchmark MemPalace was
purpose-built to win — while running on the cheap end of the LLM stack:

| Metric | Sonzai | MemPalace (hybrid_v4) |
|---|---:|---:|
| R@G (overall recall) | **0.773** | 0.741 |
| R@1 (top-hit accuracy) | **0.800** | 0.770 |
| Recall@10, multi-session | **1.000** | 1.000 |

Chat, judge, and partner agent all run on **Gemini 3.1 Flash Lite** — no
frontier-model arms race propping up the numbers. The lift is from the memory
architecture, not from spending more on inference. Drop in a heavier model and
the ceiling goes up from there.

Full scores, methodology, per-question-type breakdown, and reproduction steps
(including comparison against MemPalace's canonical `longmemeval_bench.py`):

→ [sonzai-python/benchmarks/README.md](https://github.com/sonz-ai/sonzai-python/blob/main/benchmarks/README.md)

## Staying in sync with the production API

This SDK tracks `https://api.sonz.ai/docs/openapi.json`. A git pre-push hook
checks for drift; `npm install` / `bun install` auto-enables it via the
`prepare` script. To refresh the committed spec snapshot, run
`bun run sync-spec` (or `just sync-spec`) and commit the diff.

## Development

```bash
git clone https://github.com/sonz-ai/sonzai-typescript.git
cd sonzai-typescript

bun install                 # or: npm install

bun test                    # or: npx vitest run
npx tsc --noEmit            # type check
bun run build               # or: npx tsup
```

## License

MIT License — see [LICENSE](LICENSE) for details.

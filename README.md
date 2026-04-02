# Sonzai TypeScript SDK

[![npm version](https://img.shields.io/npm/v/@sonzai-labs/agents.svg)](https://www.npmjs.com/package/@sonzai-labs/agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official TypeScript SDK for the [Sonzai Mind Layer API](https://sonz.ai). Build AI agents with persistent memory, evolving personality, and proactive behaviors.

**Zero runtime dependencies.** Uses the native `fetch` API. Works with Node.js (>=18), Bun, and Deno.

## Installation

```bash
# npm
npm install @sonzai-labs/agents

# bun
bun add @sonzai-labs/agents

# deno
import { Sonzai } from "npm:@sonzai-labs/agents";
```

## Quick Start

```ts
import { Sonzai } from "@sonzai-labs/agents";

const client = new Sonzai({ apiKey: "your-api-key" });

const response = await client.agents.chat("your-agent-id", {
  messages: [{ role: "user", content: "Hello! What's your favorite hobby?" }],
  userId: "user-123",
});
console.log(response.content);
```

## Authentication

Get your API key from the [Sonzai Dashboard](https://platform.sonz.ai) under **Projects > API Keys**.

```ts
// Pass directly
const client = new Sonzai({ apiKey: "sk-..." });

// Or set the environment variable
// SONZAI_API_KEY=sk-...
const client = new Sonzai();
```

## Usage

### Chat (Streaming)

```ts
for await (const event of client.agents.chatStream("agent-id", {
  messages: [{ role: "user", content: "Tell me a story" }],
})) {
  const content = event.choices?.[0]?.delta?.content ?? "";
  process.stdout.write(content);
}
```

### Chat (Non-streaming)

```ts
const response = await client.agents.chat("agent-id", {
  messages: [{ role: "user", content: "Hello!" }],
  userId: "user-123",
  sessionId: "session-456", // optional, auto-created if omitted
});
console.log(response.content);
console.log(`Tokens: ${response.usage?.totalTokens}`);
```

### Chat (Advanced Options)

```ts
const response = await client.agents.chat("agent-id", {
  messages: [{ role: "user", content: "Hello!" }],
  userId: "user-123",
  userDisplayName: "Alex",
  provider: "openai",
  model: "gpt-4o",
  language: "en",
  timezone: "America/New_York",
  compiledSystemPrompt: "You are a helpful assistant.",
  toolCapabilities: { web_search: true, remember_name: true, image_generation: false },
  toolDefinitions: [
    { name: "get_weather", description: "Get current weather", parameters: { type: "object", properties: { city: { type: "string" } } } },
  ],
});
```

### Memory

```ts
// Get memory tree
const memory = await client.agents.memory.list("agent-id", {
  userId: "user-123",
});
for (const node of memory.nodes) {
  console.log(`${node.title} (importance: ${node.importance})`);
}

// Search memories
const results = await client.agents.memory.search("agent-id", {
  query: "favorite food",
});
for (const fact of results.results) {
  console.log(`${fact.content} (score: ${fact.score})`);
}

// Get memory timeline
const timeline = await client.agents.memory.timeline("agent-id", {
  userId: "user-123",
  start: "2026-01-01",
  end: "2026-03-01",
});
```

### Personality

```ts
const personality = await client.agents.personality.get("agent-id");
console.log(`Name: ${personality.profile.name}`);
console.log(`Openness: ${personality.profile.big5.openness.score}`);
console.log(`Warmth: ${personality.profile.dimensions.warmth}/10`);
```

### Sessions

```ts
// Start a session
await client.agents.sessions.start("agent-id", {
  userId: "user-123",
  sessionId: "session-456",
});

// ... chat messages ...

// End a session
await client.agents.sessions.end("agent-id", {
  userId: "user-123",
  sessionId: "session-456",
  totalMessages: 10,
  durationSeconds: 300,
});

// Configure tools for an active session (OpenAI-compatible tool definitions)
await client.agents.sessions.setTools("agent-id", "session-456", [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a city",
      parameters: {
        type: "object",
        properties: { city: { type: "string" } },
      },
    },
  },
]);
```

### Agent Instances

```ts
// List instances
const instances = await client.agents.instances.list("agent-id");

// Create a new instance
const instance = await client.agents.instances.create("agent-id", {
  name: "Test Instance",
});
console.log(`Created: ${instance.instance_id}`);

// Reset an instance
await client.agents.instances.reset("agent-id", instance.instance_id);

// Delete an instance
await client.agents.instances.delete("agent-id", instance.instance_id);
```

### Notifications

```ts
// Get pending notifications
const notifications = await client.agents.notifications.list("agent-id", {
  status: "pending",
});
for (const n of notifications.notifications) {
  console.log(`[${n.check_type}] ${n.generated_message}`);
}

// Consume a notification
await client.agents.notifications.consume("agent-id", "msg-id");

// Get notification history
const history = await client.agents.notifications.history("agent-id");
```

### Context Engine Data

```ts
const mood = await client.agents.getMood("agent-id", { userId: "user-123" });
const moodHistory = await client.agents.getMoodHistory("agent-id", { userId: "user-123" });
const moodAggregate = await client.agents.getMoodAggregate("agent-id");
const relationships = await client.agents.getRelationships("agent-id");
const habits = await client.agents.getHabits("agent-id");
const interests = await client.agents.getInterests("agent-id");
const diary = await client.agents.getDiary("agent-id");
const users = await client.agents.getUsers("agent-id");
```

### Goals

```ts
// List goals
const goals = await client.agents.getGoals("agent-id");

// Create a goal (omit userId for agent-global, include for per-user)
const goal = await client.agents.createGoal("agent-id", {
  title: "Learn guitar",
  description: "Practice 30 minutes daily",
  type: "skill_mastery",
  priority: 1,
  userId: "user-123", // optional
});

// Update a goal
await client.agents.updateGoal("agent-id", goal.id, { status: "completed" });

// Delete (soft-abandon) a goal
await client.agents.deleteGoal("agent-id", goal.id, { userId: "user-123" });
```

### Wakeups

```ts
// Schedule a proactive check-in
const wakeup = await client.agents.scheduleWakeup("agent-id", {
  userId: "user-123",
  scheduledAt: "2026-06-01T09:00:00Z",
  checkType: "birthday",
  occasion: "User's birthday",
});
```

### Image Generation

```ts
// Generate an image using the agent's personality and context
const image = await client.agents.generation.generateImage("agent-id", {
  prompt: "A serene mountain lake at sunset",
  style: "photorealistic", // optional
  userId: "user-123",      // optional — personalises the image
});
console.log(image.url);
```

### Evaluation

```ts
const result = await client.agents.evaluate("agent-id", {
  messages: [
    { role: "user", content: "I'm feeling sad today" },
    { role: "assistant", content: "I'm sorry to hear that..." },
  ],
  templateId: "template-uuid",
});
console.log(`Score: ${result.score}`);
console.log(`Feedback: ${result.feedback}`);
```

### Simulation

```ts
// Streaming — launches run, then streams events
for await (const event of client.agents.simulate("agent-id", {
  userPersona: {
    name: "Alex",
    background: "College student",
    personality_traits: ["curious", "friendly"],
    communication_style: "casual",
  },
  config: {
    max_sessions: 3,
    max_turns_per_session: 10,
  },
})) {
  console.log(`[${event.type}] ${event.message}`);
}

// Fire-and-forget (returns RunRef immediately)
const ref = await client.agents.simulateAsync("agent-id", {
  userPersona: { name: "Alex", background: "Student" },
  config: { max_sessions: 2 },
});
console.log(`Run started: ${ref.run_id}`);

// Reconnect to stream later (supports resuming via fromIndex)
for await (const event of client.evalRuns.streamEvents(ref.run_id, 0)) {
  console.log(`[${event.type}] ${event.message}`);
}
```

### Run Eval (Simulation + Evaluation)

```ts
// Combined simulation + evaluation
for await (const event of client.agents.runEval("agent-id", {
  templateId: "template-uuid",
  userPersona: { name: "Alex", background: "Student" },
  simulationConfig: { max_sessions: 2, max_turns_per_session: 5 },
})) {
  console.log(`[${event.type}] ${event.message}`);
}

// Fire-and-forget
const ref = await client.agents.runEvalAsync("agent-id", {
  templateId: "template-uuid",
  simulationConfig: { max_sessions: 2 },
});
console.log(`Run started: ${ref.run_id}`);
```

### Re-evaluate (Eval Only)

```ts
// Re-evaluate an existing run with a different template
for await (const event of client.agents.evalOnly("agent-id", {
  templateId: "new-template-uuid",
  sourceRunId: "existing-run-uuid",
})) {
  console.log(`[${event.type}] ${event.message}`);
}
```

### Custom States

```ts
// Create a custom state
const state = await client.agents.customStates.create("agent-id", {
  key: "player_level",
  value: { level: 15, xp: 2400 },
  scope: "user",
  contentType: "json",
  userId: "user-123",
});

// List states
const states = await client.agents.customStates.list("agent-id", {
  scope: "global",
});

// Upsert by composite key (create or update)
const updated = await client.agents.customStates.upsert("agent-id", {
  key: "player_level",
  value: { level: 16, xp: 3000 },
  scope: "user",
  userId: "user-123",
});

// Get by composite key
const found = await client.agents.customStates.getByKey("agent-id", {
  key: "player_level",
  scope: "user",
  userId: "user-123",
});

// Delete by composite key
await client.agents.customStates.deleteByKey("agent-id", {
  key: "player_level",
  scope: "user",
  userId: "user-123",
});
```

### Eval Templates

```ts
// List
const templates = await client.evalTemplates.list();

// Create
const template = await client.evalTemplates.create({
  name: "Empathy Check",
  scoringRubric: "Evaluate emotional awareness",
  categories: [
    { name: "Awareness", weight: 0.5, criteria: "..." },
    { name: "Response", weight: 0.5, criteria: "..." },
  ],
});

// Update
await client.evalTemplates.update(template.id, { name: "Updated" });

// Delete
await client.evalTemplates.delete(template.id);
```

### Eval Runs

```ts
const runs = await client.evalRuns.list({ agentId: "agent-id" });
const run = await client.evalRuns.get("run-id");
await client.evalRuns.delete("run-id");

// Stream events from a running eval (reconnectable)
for await (const event of client.evalRuns.streamEvents("run-id")) {
  console.log(`[${event.type}] ${event.message}`);
}
```

## Configuration

```ts
const client = new Sonzai({
  apiKey: "sk-...",              // or SONZAI_API_KEY env var
  baseUrl: "https://api.sonz.ai", // or SONZAI_BASE_URL env var
  timeout: 30_000,              // request timeout in ms
  maxRetries: 2,                // retry count for failed requests
});
```

## Error Handling

```ts
import {
  Sonzai,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
  RateLimitError,
  SonzaiError,
} from "@sonzai-labs/agents";

try {
  const res = await client.agents.chat("agent-id", { messages: [...] });
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (err instanceof NotFoundError) {
    console.log("Agent not found");
  } else if (err instanceof RateLimitError) {
    const wait = err.retryAfter ?? 60;
    console.log(`Rate limited. Retry in ${wait}s`);
  } else if (err instanceof SonzaiError) {
    console.log(`API error: ${err.message}`);
  }
}
```

## Runtime Compatibility

| Runtime | Version | Status |
|---------|---------|--------|
| Node.js | >= 18   | Full support |
| Bun     | >= 1.0  | Full support |
| Deno    | >= 1.28 | Full support |

The SDK uses only the standard Web API (`fetch`, `ReadableStream`, `TextDecoder`, `URL`, `AbortController`) with no runtime-specific dependencies.

## Development

```bash
# Clone
git clone https://github.com/sonz-ai/sonzai-typescript.git
cd sonzai-typescript

# Install (bun or npm)
bun install

# Run tests
bun test         # or: npx vitest run

# Type check
npx tsc --noEmit

# Build
bun run build    # or: npx tsup
```

## License

MIT License - see [LICENSE](LICENSE) for details.

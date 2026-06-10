# Changelog

All notable changes to `@sonzai-labs/agents` are documented here. The project
follows [Semantic Versioning](https://semver.org/). Dates are `YYYY-MM-DD`.

## 1.7.0 — 2026-06-10

### Added

- New `builtinAgents` resource (`client.builtinAgents`) for Sonzai Built-in
  Agents — platform-hosted vertical task agents invoked by slug (current
  catalog: `lead_research`, `market_intel`, `lead_extract`, `lead_score`,
  `lead_qualifier`). Runs are billed per token plus runtime at the tenant's
  billing mode.
  - `list()` — built-in agent catalog with provisioning state.
  - `invoke(slug, {input, title?})` — blocking invocation (`stream=false`).
    Long-running: the SDK applies a 20-minute deadline instead of the
    client-level timeout.
  - `invokeStream(slug, {input, title?, onUpdate?})` — streaming invocation
    (`stream=true`); `onUpdate` receives every progress frame (status,
    thinking, message, tool_use, tool_result, findings, usage, error) and the
    call resolves with the final `BuiltinAgentInvokeResult`.
  - `sessions.create({agent, title?})`, `sessions.list({limit?})`,
    `sessions.get(id)`, `sessions.send(id, {text, onUpdate?})` (streaming),
    and `sessions.sendBlocking(id, {text})` for multi-turn follow-up chat.
  - Exports: `BuiltinAgentSlug`, `BuiltinAgentSummary`,
    `BuiltinAgentListResponse`, `BuiltinAgentUsage`,
    `BuiltinAgentInvokeResult`, `BuiltinAgentUpdate`,
    `BuiltinAgentInvokeOptions`, `BuiltinAgentInvokeStreamOptions`,
    `BuiltinAgentSession`, `BuiltinAgentSessionDetail`,
    `BuiltinAgentSessionListResponse`, `BuiltinAgentSessionListOptions`,
    `CreateBuiltinAgentSessionOptions`, `BuiltinAgentChatTurnResult`,
    `BuiltinAgentSendOptions`, `BuiltinAgentSendBlockingOptions`.
- `HTTPClient.streamNamedSSE(...)` — named-event SSE parser
  (`event: <name>` + `data: <json>` frames) used by the built-in agents
  streaming endpoints; supports query params and a per-call deadline.
- REST surface: `GET /api/v1/builtin-agents`,
  `POST /api/v1/builtin-agents/{slug}/invoke?stream=<bool>`,
  `POST/GET /api/v1/builtin-agents/sessions[/{id}]`, and
  `POST /api/v1/builtin-agents/sessions/{id}/messages?stream=<bool>`.

## 1.6.0 — 2026-05-22

### Added

- Detached chat variants for queue workers / Express / Hono / NATS handlers
  whose caller signal lifetime is shorter than an AI generation. They use a
  fresh inner `AbortController` that is **not** chained to the caller's
  signal, enforce an SDK-managed 5-minute timeout, and watch an optional
  `parentSignal` to surface misuse via a one-shot warning or callback.
  - `client.agents.chatDetached(options, opts?: DetachOptions): Promise<ChatResponse>`
  - `client.agents.chatStreamDetached(options, callback, opts?: DetachOptions): Promise<void>`
  - `client.agents.chatStreamChannelDetached(options, opts?: DetachOptions): AsyncIterableIterator<ChatStreamEvent>`
  - Exports: `DetachOptions`, `DetachLogger`, `DEFAULT_DETACHED_TIMEOUT_MS`.
- `ChatOptions.temperature?: number` — override the AI service's default
  sampling temperature. Omit to keep the server-side default. The Platform
  adapts or omits the value for providers whose models constrain it, so
  callers do not need to know provider-specific rules. `temperature: 0`
  is forwarded as a literal zero.

## 1.5.2 — 2026-05-07

### Added

- New `byok` resource (`client.byok`) exposing project-scoped bring-your-own-key
  management: `list`, `set`, `delete`, `setActive`, and `test`.
- Positional argument signature: `set(projectId, provider, apiKey)` and
  `setActive(projectId, provider, isActive)` — consistent with the rest of the SDK.
- `BYOKProvider` union type: `"openai" | "gemini" | "xai" | "openrouter"`.
- Keys are validated against the provider's `/v1/models` endpoint before storage;
  upstream LLM billing for the project routes through the customer's key.
- REST surface: `GET/PUT/PATCH/DELETE /api/v1/projects/{projectId}/byok-keys[/{provider}]`
  and `POST /api/v1/projects/{projectId}/byok-keys/{provider}/test`.

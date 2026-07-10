# Changelog

All notable changes to `@sonzai-labs/agents` are documented here. The project
follows [Semantic Versioning](https://semver.org/). Dates are `YYYY-MM-DD`.

## 1.9.0 — 2026-07-10

### Added

- `client.runtime`: per-turn context bundles, transcript read/write,
  provider-neutral backend-agent artifacts, and signed invoice-grade usage
  ingestion for custom runtimes. The resource intentionally has no completion
  method; LLM calls execute directly in the tenant runtime.
- Usage-report schema v2 and cross-language canonical HMAC helpers with
  tenant/project/agent/provider/model attribution, cache token fields,
  idempotent report IDs, billing mode, and unreported-turn accounting.
- `client.routing`: typed routing policy, guide/handoff/channel configuration,
  contact classification, and permanent-route operations.
- `client.request(...)` as a typed transport escape hatch for new platform
  operations between convenience-resource releases.

### Changed

- Standard usage represents provider benchmark cost × 1.33. BYOK/BYOM usage
  represents a 33% Sonzai service fee because the tenant pays its provider
  directly.

## 1.8.0 — 2026-07-10

### Added

- Built-in agent additions:
  - `enrichLead({lead, webhookUrl?})` enqueues an asynchronous lead-enrichment
    job and `getEnrichment(jobId)` polls it through completion.
  - `recordLeadOutcome(...)` and `getLeadCalibration()` provide the lead-score
    feedback loop. `learnAgent`, `getAgentGuidance`,
    `rollbackAgentGuidance`, and `setAgentLearning` provide learned-guidance
    management and its project-level kill switch.
- New `ml` resource (`client.ml`) for tenant-scoped scoring and reinforcement
  learning: `trainScoring`, `predictScore`, `decideNba`, `learnNba`,
  `evaluateOpe`, `simulateRounds`, and unified `recordFeedback` operations,
  each keyed by a free-form use case.
- Knowledge Base parity additions: document classification patching, re-ingest
  and cost lookup; fact list, active-fact, and history lookups; entity lookup,
  graph traversal, and comparison; and multimodal schema list/create/activate
  operations. `client.agents.updatePersonality(...)` is also available.
- New `channels` resource (`client.channels`) for project notification-channel
  CRUD, with typed channel events via `CHANNEL_EVENTS`.
- New `customAgents` and `pipelines` resources for defining custom backend
  agents and chaining built-in or custom agents into pipelines. Pipelines
  support CRUD and `appendStep`.
- Omnichannel conversation support: `client.conversations` can list and read
  conversations and messages, stream events, take over or release a
  conversation, send as an agent, mark it read, and update it. New
  `client.channelConnections` provides project-scoped Meta channel-connection
  CRUD and connection testing.
- Lead-distribution adapter surface:
  - `client.leadAssignments` supports offer, list, get, claim, release, and
    complete operations.
  - `client.ingest` supports normalized event submission, contact upsert, and
    event listing; `INGEST_EVENT_TYPES` exposes the DomainEvent v1 values.
  - `client.conversations.push(...)` pushes an external conversation into the
    omnichannel inbox.
- New runtime-local CRM resource (`client.crm`) for a deployed app-runtime
  instance. It targets the configured `runtimeBaseUrl` under `/api/rt/crm/*`,
  not `api.sonz.ai`, and requires a separate runtime `ADAPTER_TOKEN` via
  `runtimeApiKey` (with optional `runtimeTenantId` sent as
  `X-Sonzai-Tenant-ID`). The adapter-token surface provides idempotent bulk
  contact upsert through `import` / `importContacts` and cursor-based change
  events through `events` / `iterateEvents`; this release does not expose
  separate runtime CRM CRUD methods.

### Changed

- Pipeline runs are asynchronous. `client.pipelines.run(...)` returns the
  queued run; use `getRun` or `listRuns` to poll, or `runAndWait` to wait for a
  terminal result.

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

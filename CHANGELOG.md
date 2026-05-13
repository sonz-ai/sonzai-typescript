# Changelog

All notable changes to `@sonzai-labs/agents` are documented here. The project
follows [Semantic Versioning](https://semver.org/). Dates are `YYYY-MM-DD`.

## Unreleased

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

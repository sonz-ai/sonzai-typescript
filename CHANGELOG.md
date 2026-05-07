# Changelog

All notable changes to `@sonzai-labs/agents` are documented here. The project
follows [Semantic Versioning](https://semver.org/). Dates are `YYYY-MM-DD`.

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

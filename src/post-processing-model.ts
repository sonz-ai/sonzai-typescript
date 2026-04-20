import type { PostProcessingModelMap } from "./types.js";

/**
 * Config key under which the chat-model → post-processing-model map is
 * stored at both the project and account scope. Every layer of the server's
 * resolver cascade reads the same key — see
 * `sonzai-ai-monolith-ts/docs/post-processing-model-mapping.md`.
 */
export const POST_PROCESSING_MODEL_MAP_KEY = "post_processing_model_map";

/**
 * Per-layer wildcard. Entries keyed on `"*"` apply to any chat model that
 * has no explicit entry at the same layer.
 */
export const POST_PROCESSING_WILDCARD_KEY = "*";

/**
 * Decode a raw config value (the `value` field of a config entry) into a
 * typed `PostProcessingModelMap`. Returns `null` when the value is missing
 * or when it cannot be interpreted as a map — callers should treat both
 * cases as "no map configured".
 *
 * The parse is defensive: unknown/extra fields on each entry are ignored,
 * missing `provider` or `model` causes that entry to be dropped rather
 * than throwing, so a partially-corrupt config doesn't prevent the rest
 * from resolving.
 */
export function decodePostProcessingMap(
  value: unknown,
): PostProcessingModelMap | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const out: PostProcessingModelMap = {};
  for (const [chatModel, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as { provider?: unknown; model?: unknown };
    if (typeof e.provider !== "string" || typeof e.model !== "string") continue;
    if (e.model === "") continue;
    out[chatModel] = { provider: e.provider, model: e.model };
  }
  return out;
}

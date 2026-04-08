/**
 * LLM provider identifiers and their available model IDs.
 *
 * Use these constants when specifying a `provider` or `model` in chat requests,
 * or when building a model picker UI. At runtime you can also call
 * `client.listModels()` to get the live list of providers and models enabled
 * on the current deployment.
 *
 * @example
 * ```ts
 * import { Sonzai, providers } from "sonzai";
 *
 * const client = new Sonzai({ apiKey: "..." });
 *
 * // Use a constant directly
 * const response = await client.agents.chat({
 *   agent: "agent-id",
 *   messages: [{ role: "user", content: "Hello!" }],
 *   provider: providers.GEMINI,
 *   model: providers.models.gemini.FLASH_LITE,
 * });
 *
 * // Or fetch the live list
 * const { providers: live, default_model } = await client.listModels();
 * console.log("Available providers:", live.map(p => p.provider));
 * ```
 */

// ---------------------------------------------------------------------------
// Provider identifiers
// ---------------------------------------------------------------------------

/** Provider ID for Google Gemini. */
export const GEMINI = "gemini";

/** Provider ID for Zhipu AI (GLM-4 family). */
export const ZHIPU = "zhipu";

/** Provider ID for VolcEngine (Doubao family). */
export const VOLCENGINE = "volcengine";

/** Provider ID for OpenRouter (multi-model gateway). */
export const OPENROUTER = "openrouter";

/** Provider ID for a project-configured custom LLM (BYOM). */
export const CUSTOM = "custom";

// ---------------------------------------------------------------------------
// Model IDs per provider
// ---------------------------------------------------------------------------

export const models = {
  /** Google Gemini model IDs. */
  gemini: {
    /** Fast, cost-efficient model — recommended default for most use cases. */
    FLASH_LITE: "gemini-3.1-flash-lite-preview",
  },

  /** Zhipu AI (GLM-4 family) model IDs. */
  zhipu: {
    /** Lightweight, zero-cost flash model for high-throughput workloads. */
    GLM4_FLASH: "glm-4-flash",
    /** Highest-capability GLM-4 model. */
    GLM4_PLUS: "glm-4-plus",
  },

  /** VolcEngine (Doubao family) model IDs. */
  volcengine: {
    /** Long-context character model optimised for roleplay and dialogue. */
    DOUBAO_CHARACTER: "doubao-1-5-pro-32k-character",
  },

  /** OpenRouter model IDs (gateway — used as fallback). */
  openrouter: {
    CLAUDE_HAIKU: "anthropic/claude-3-haiku",
    CLAUDE_SONNET: "anthropic/claude-3.5-sonnet",
  },
} as const;

/** The platform default model ID. */
export const DEFAULT_MODEL = models.gemini.FLASH_LITE;

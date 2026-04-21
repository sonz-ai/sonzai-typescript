#!/usr/bin/env node
/**
 * Generates src/generated/flat-exports.ts from openapi.json + name-overrides.json.
 *
 * Every schema in components.schemas becomes a flat named export:
 *   export type Goal = components["schemas"]["Goal"];
 *
 * Types in HAND_WRITTEN_EXCLUSIONS are skipped — they have hand-written definitions
 * in src/types.ts that differ from (or extend) the spec schema.
 *
 * Types with overrides in name-overrides.json are re-exported under the SDK name:
 *   export type ScheduledWakeup = components["schemas"]["WakeupEntry"];
 *
 * Run: node scripts/generate-flat-exports.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const spec = JSON.parse(readFileSync(resolve(root, "openapi.json"), "utf8"));
const overrides = JSON.parse(
  readFileSync(resolve(root, "name-overrides.json"), "utf8")
);

// Spec schemas that have hand-written definitions in src/types.ts.
// These are excluded from auto-generation to prevent duplicate-export conflicts.
const HAND_WRITTEN_EXCLUSIONS = new Set([
  "AtomicFact",
  "MemoryNode",
  "MemoryResponse",
  "TimelineSession",
  "Big5Trait",
  "Big5",
  "PersonalityDimensions",
  "TraitPrecision",
  "PersonalityProfile",
  "PersonalityResponse",
  "AgentInstance",
  "MoodState",
  "MoodHistoryEntry",
  "DiaryEntry",
  "UsersResponse",
  "ConstellationResponse",
  "ProcessSideEffectsSummary",
  "ProcessResponse",
  "SignificantMoment",
  "SignificantMomentsResponse",
  "PersonalityShift",
  "MemorySummary",
  "KBNode",
  "KBEdge",
  "KBNodeHistory",
  "KBSearchResult",
  "InsertFactEntry",
  "InsertRelEntry",
  "InsertFactDetail",
  "KBRecommendationScore",
  "PrimeContentBlock",
  "PrimeUserMetadata",
  "UserPrimingMetadata",
  "BatchImportUser",
  "StructuredImportSpec",
  "InventoryItem",
  "ListAllFactsResponse",
  "StoredFact",
  "CustomLLMConfigResponse",
  "EvalTemplate",
  "EvalRun",
  "UserPersona",
  "ImportJob",
  "BatchPersonalityEntry",
  "BatchPersonalityResponse",
  "EvalCategory",
]);

const schemas = Object.keys(spec.components?.schemas ?? {}).sort();
const sdkNamesEmitted = new Set();

const lines = [
  "// AUTO-GENERATED — do not edit.",
  "// Re-run `npm run generate-types` (or `just sync-spec`) to update.",
  'import type { components } from "./openapi.js";',
  "",
  "// Re-export raw spec types for advanced users",
  'export type { components } from "./openapi.js";',
  "",
];

let exported = 0;

for (const specName of schemas) {
  if (HAND_WRITTEN_EXCLUSIONS.has(specName)) continue;

  const sdkName = overrides[specName] ?? specName;

  // Avoid emitting the same SDK name twice (e.g. if spec has both "Foo" and
  // an overridden "Bar" → "Foo").
  if (sdkNamesEmitted.has(sdkName)) continue;
  sdkNamesEmitted.add(sdkName);

  lines.push(
    `export type ${sdkName} = components["schemas"]["${specName}"];`
  );
  exported++;
}

mkdirSync(resolve(root, "src/generated"), { recursive: true });
writeFileSync(resolve(root, "src/generated/flat-exports.ts"), lines.join("\n") + "\n");

console.log(`✓ Generated ${exported} type exports → src/generated/flat-exports.ts`);

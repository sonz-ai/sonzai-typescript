// Re-export all spec-derived types so resource files can import from this module
// without knowing about the generated layer.
export type * from "./generated/flat-exports.js";

// Import spec types used in hand-written interface bodies below.
import type {
  PersonalityDelta,
  Goal,
  KBRelatedNode,
  KBSchemaField,
  KBSimilarityConfig,
  KBResolutionInfo,
  KBCandidate,
  Project,
  ProjectAPIKey,
  UserPersonaRecord,
  ToolSchemaEntry,
} from "./generated/flat-exports.js";

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatChoice {
  delta: { content?: string };
  finish_reason: string | null;
  index: number;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatStreamEvent {
  choices?: ChatChoice[];
  usage?: ChatUsage;
  type?: string;
  data?: Record<string, unknown>;
  error?: { message: string };

  // Rich event fields (populated based on type)
  message_index?: number;
  is_follow_up?: boolean;
  replacement?: boolean;
  full_content?: string;
  finish_reason?: string;
  continuation_token?: string;
  response_cookie?: string;
  message_count?: number;
  side_effects?: Record<string, unknown>;
  external_tool_calls?: ExternalToolCall[];
  enriched_context?: Record<string, unknown>;
  build_duration_ms?: number;
  used_fast_path?: boolean;
  error_message?: string;
  error_code?: string;
  is_token_error?: boolean;
}

export interface ChatResponse {
  content: string;
  sessionId: string;
  usage?: ChatUsage;
}

export interface ExternalToolCall {
  id: string;
  name: string;
  parameters?: Record<string, unknown>;
}

export interface ToolCallResponseOptions {
  session_id: string;
  user_id?: string;
  tool_call_id: string;
  result: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface GameContext {
  custom_fields?: Record<string, string>;
  game_state_json?: unknown;
}

export interface ChatOptions {
  /** Agent UUID or agent name. Names are resolved to deterministic UUIDs on the server. */
  agent: string;
  messages: ChatMessage[];
  userId?: string;
  userDisplayName?: string;
  sessionId?: string;
  instanceId?: string;
  provider?: string;
  model?: string;
  continuationToken?: string;
  aiServiceCookie?: string;
  requestType?: string;
  language?: string;
  compiledSystemPrompt?: string;
  interactionRole?: string;
  timezone?: string;
  toolCapabilities?: AgentToolCapabilities;
  toolDefinitions?: ToolDefinition[];
  maxTurns?: number;
  skipContextBuild?: boolean;
  gameContext?: GameContext;
  skillLevels?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export interface MemoryNode {
  node_id: string;
  agent_id: string;
  user_id: string;
  parent_id: string;
  title: string;
  summary: string;
  importance: number;
  created_at?: string;
  updated_at?: string;
}

export interface AtomicFact {
  fact_id: string;
  agent_id: string;
  user_id: string;
  node_id: string;
  atomic_text: string;
  fact_type: string;
  importance: number;
  confidence?: number;
  supersedes_id: string;
  session_id: string;
  source_id?: string;
  source_type?: string;
  sentiment?: string;
  entities?: string[];
  inferred_entities?: string[];
  topic_tags?: string[];
  agent_framing?: string;
  character_salience?: number;
  emotional_intensity?: number;
  relationship_relevance?: number;
  retention_strength?: number;
  temporal_relevance?: string;
  time_sensitive_at?: string;
  episode_id?: string;
  event_time?: string;
  evidence_message_ids?: string[];
  polarity_group_id?: string;
  hit_count?: number;
  miss_count?: number;
  mention_count?: number;
  last_confirmed?: string;
  last_retrieved_at?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface MemoryResponse {
  nodes: MemoryNode[];
  contents: Record<string, AtomicFact[]>;
}

// MemorySearchResult is now re-exported from ./generated/aliases.js (as SearchResult)

// MemorySearchResponse is now re-exported from ./generated/aliases.js (as SearchResponse)

export interface TimelineSession {
  session_id: string;
  facts: AtomicFact[];
  first_fact_at?: string;
  last_fact_at?: string;
  fact_count: number;
}

// MemoryTimelineResponse is now re-exported from ./generated/aliases.js (as TimelineResponse)

export interface MemoryListOptions {
  userId?: string;
  instanceId?: string;
  parentId?: string;
  includeContents?: boolean;
  limit?: number;
}

export interface MemorySearchOptions {
  query: string;
  instanceId?: string;
  limit?: number;
}

export interface MemoryTimelineOptions {
  userId?: string;
  instanceId?: string;
  start?: string;
  end?: string;
}

// ---------------------------------------------------------------------------
// Personality
// ---------------------------------------------------------------------------

export interface Big5Trait {
  score: number;
  percentile: number;
  confidence?: number;
}

export interface Big5 {
  openness: Big5Trait;
  conscientiousness: Big5Trait;
  extraversion: Big5Trait;
  agreeableness: Big5Trait;
  neuroticism: Big5Trait;
}

export interface PersonalityDimensions {
  intellect: number;
  aesthetic: number;
  industriousness: number;
  orderliness: number;
  enthusiasm: number;
  assertiveness: number;
  compassion: number;
  politeness: number;
  withdrawal: number;
  volatility: number;
}

export interface PersonalityPreferences {
  conversation_pace: string;
  formality: string;
  humor_style: string;
  emotional_expression: string;
}

export interface PersonalityBehaviors {
  response_length: string;
  question_frequency: string;
  empathy_style: string;
  conflict_approach: string;
}

export interface TraitPrecision {
  precision: number;
  observation_count: number;
  last_updated_at?: string;
}

export interface PersonalityProfile {
  agent_id: string;
  name: string;
  gender: string;
  bio: string;
  avatar_url: string;
  personality_prompt: string;
  speech_patterns: string[];
  true_interests: string[];
  true_dislikes: string[];
  primary_traits: string[];
  temperature: number;
  big5: Big5;
  dimensions: PersonalityDimensions;
  preferences: PersonalityPreferences;
  behaviors: PersonalityBehaviors;
  emotional_tendencies: Record<string, number>;
  trait_precisions?: Record<string, TraitPrecision>;
  created_at?: string;
}

// PersonalityDelta is now re-exported from ./generated/aliases.js

export interface PersonalityResponse {
  profile: PersonalityProfile;
  evolution: PersonalityDelta[];
}

export interface PersonalityGetOptions {
  historyLimit?: number;
  since?: string;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface SessionStartOptions {
  userId: string;
  userDisplayName?: string;
  sessionId: string;
  instanceId?: string;
  toolDefinitions?: ToolDefinition[];
}

export interface SessionEndOptions {
  userId: string;
  sessionId: string;
  instanceId?: string;
  totalMessages?: number;
  durationSeconds?: number;
  messages?: ChatMessage[];
}

export interface SessionResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------

export interface AgentInstance {
  instance_id: string;
  agent_id: string;
  name: string;
  description: string;
  status: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstanceListResponse {
  instances: AgentInstance[];
}

export interface InstanceCreateOptions {
  name: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  message_id: string;
  agent_id: string;
  user_id: string;
  wakeup_id: string;
  check_type: string;
  intent: string;
  generated_message: string;
  status: string;
  consumed_at?: string;
  created_at?: string;
}

// NotificationListResponse is now re-exported from ./generated/aliases.js (as ProactiveNotificationsResponse)

export interface NotificationListOptions {
  status?: string;
  userId?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Context Engine Data
// ---------------------------------------------------------------------------

export interface ContextDataOptions {
  userId?: string;
  instanceId?: string;
}

export interface MoodState {
  valence: number;
  arousal: number;
  tension: number;
  affiliation: number;
  label?: string;
  /** @deprecated Use valence instead. */
  happiness?: number;
  /** @deprecated Use arousal instead. */
  energy?: number;
  /** @deprecated Use tension instead. */
  calmness?: number;
  /** @deprecated Use affiliation instead. */
  affection?: number;
}

// MoodResponse is now re-exported from ./generated/aliases.js

export interface MoodHistoryEntry {
  valence: number;
  arousal: number;
  tension: number;
  affiliation: number;
  label?: string;
  trigger_type?: string;
  trigger_reason?: string;
  delta_valence?: number;
  delta_arousal?: number;
  delta_tension?: number;
  delta_affiliation?: number;
  timestamp: string;
}

// MoodHistoryResponse is now re-exported from ./generated/aliases.js

// MoodAggregateResponse is now re-exported from ./generated/aliases.js

export interface RelationshipData {
  user_id: string;
  love_score: number;
  chemistry_score?: number;
  narrative?: string;
  last_update?: string;
  updated_at?: string;
}

// RelationshipResponse is now re-exported from ./generated/aliases.js

export interface HabitData {
  name: string;
  strength: number;
  category?: string;
  description?: string;
  display_name?: string;
  formed?: boolean;
  daily_reinforced?: number;
  last_update?: string;
}

// HabitsResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Habits (CRUD)
// ---------------------------------------------------------------------------

// Habit is now re-exported from ./generated/aliases.js

export interface CreateHabitOptions {
  userId?: string;
  name: string;
  category?: string;
  description?: string;
  displayName?: string;
  strength?: number;
}

export interface UpdateHabitOptions {
  userId?: string;
  category?: string;
  description?: string;
  displayName?: string;
  strength?: number;
}

export interface DeleteHabitOptions {
  userId?: string;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export type GoalType =
  | "personal_growth"
  | "skill_mastery"
  | "relationship"
  | "learning_discovery";

export type GoalStatus = "active" | "achieved" | "abandoned";

export type GoalPriority = 0 | 1 | 2;

// Goal is now re-exported from ./generated/aliases.js

// GoalsResponse is now re-exported from ./generated/aliases.js

export interface CreateGoalOptions {
  /** When set, creates a per-user goal instead of an agent-global goal. */
  userId?: string;
  type?: GoalType;
  title: string;
  description: string;
  /** 0 = low, 1 = medium, 2 = high */
  priority?: GoalPriority;
  relatedTraits?: string[];
}

export interface UpdateGoalOptions {
  /** Required for per-user goals. */
  userId?: string;
  title?: string;
  description?: string;
  /** 0 = low, 1 = medium, 2 = high */
  priority?: GoalPriority;
  status?: GoalStatus;
  relatedTraits?: string[];
}

export interface DeleteGoalOptions {
  /** Required for per-user goals. */
  userId?: string;
}

export interface InitialGoal {
  type?: GoalType;
  title: string;
  description: string;
  /** 0 = low, 1 = medium, 2 = high */
  priority?: GoalPriority;
  relatedTraits?: string[];
}
export interface InterestData {
  topic: string;
  /** @deprecated Use confidence instead. */
  score?: number;
  category?: string;
  agent_id?: string;
  user_id?: string;
  confidence?: number;
  engagement_level?: number;
  mention_count?: number;
  research_status?: string;
  research_findings?: string;
  last_mentioned_at?: string;
  created_at?: string;
  updated_at?: string;
}

// InterestsResponse is now re-exported from ./generated/aliases.js

export interface DiaryEntry {
  entry_id: string;
  agent_id: string;
  user_id?: string;
  date: string;
  content: string;
  title?: string;
  body_lines?: string[];
  /** @deprecated Use content instead. */
  body?: string;
  mood?: string;
  topics?: string[];
  tags?: string[];
  trigger_type?: string;
  created_at: string;
}

export interface DiaryResponse {
  entries: DiaryEntry[];
}

export interface UsersResponse {
  users: Record<string, unknown>[];
}

export interface ConstellationEdge {
  edge_id: string;
  agent_id: string;
  source_id: string;
  target_id: string;
  relation: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface ConstellationInsight {
  insight_id: string;
  agent_id: string;
  user_id?: string;
  content: string;
  type: string;
  surfaced: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface ConstellationResponse {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  insights: ConstellationInsight[];
}

// ---------------------------------------------------------------------------
// Constellation (CRUD)
// ---------------------------------------------------------------------------

export interface ConstellationNode {
  node_id: string;
  agent_id: string;
  user_id?: string;
  /** Canonical node type (e.g. "concept", "person", "place"). */
  node_type: string;
  /** Legacy alias for node_type returned by some endpoints. */
  type?: string;
  label: string;
  description?: string;
  significance: number;
  weight?: number;
  mention_count: number;
  brightness: number;
  metadata?: Record<string, unknown>;
  first_mentioned_at?: string;
  last_mentioned_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateConstellationNodeOptions {
  userId?: string;
  nodeType?: string;
  label: string;
  description?: string;
  significance?: number;
}

export interface UpdateConstellationNodeOptions {
  label?: string;
  description?: string;
  significance?: number;
  nodeType?: string;
}

// Breakthrough is now re-exported from ./generated/aliases.js

// BreakthroughsResponse is now re-exported from ./generated/aliases.js

// WakeupsResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Process (full pipeline — extraction + side effects + memory + session end)
// ---------------------------------------------------------------------------

export interface ProcessOptions {
  userId: string;
  sessionId?: string;
  instanceId?: string;
  messages: ChatMessage[];
  /** LLM provider for extraction (e.g. "gemini", "openai", "openrouter"). Falls back to platform default. */
  provider?: string;
  /** LLM model for extraction (e.g. "gemini-2.5-flash", "gpt-4o-mini"). Falls back to platform default. */
  model?: string;
  /** When true, the response includes the full extraction payload in `extractions`. */
  includeExtractions?: boolean;
}

export interface ProcessSideEffectsSummary {
  mood_updated: boolean;
  personality_updated: boolean;
  habits_observed: number;
  interests_detected: number;
}

// ---------------------------------------------------------------------------
// Context (single-call enriched context)
// ---------------------------------------------------------------------------

export interface GetContextOptions {
  userId: string;
  sessionId?: string;
  instanceId?: string;
  /** Current user message — used for supplementary memory search. */
  query?: string;
  language?: string;
  /** IANA timezone (e.g. "Asia/Singapore"). */
  timezone?: string;
}

/**
 * Full enriched agent context returned by the 7-layer context builder.
 * Fields use snake_case matching the Go JSON serialization.
 * Forward-compatible via index signature.
 */
export interface EnrichedContextResponse {
  // Layer 1: Core Identity
  bio?: string;
  personality_prompt?: string;
  speech_patterns?: string[];
  true_interests?: string[];
  true_dislikes?: string[];
  primary_traits?: string[];

  // Layer 2: Personality
  big5?: Big5;
  dimensions?: PersonalityDimensions;
  preferences?: PersonalityPreferences;
  behaviors?: PersonalityBehaviors;

  // Layer 3: Evolution
  recent_personality_shifts?: PersonalityShift[];
  significant_moments?: SignificantMoment[];
  active_goals?: Goal[];
  habits?: HabitData[];
  breakthrough_count?: number;

  // Layer 4: Relationship
  relationship_narrative?: string;
  shared_memory_summary?: string;
  chemistry_score?: number;
  love_from_agent?: number;
  love_from_user?: number;
  relationship_status?: string;
  days_since_last_chat?: number;

  // Layer 5: Current State
  current_mood?: MoodState;
  emotional_state?: string;
  capabilities?: AgentToolCapabilities;

  // Layer 6: Memory
  loaded_facts?: ContextLoadedFact[];
  long_term_summaries?: ContextLongTermSummary[];

  // Layer 6b: Proactive
  proactive_memories?: ContextProactiveMemory[];

  // Layer 6c: Constellation
  constellation_patterns?: ContextConstellationPattern[];

  // Layer 7: Backend Context
  // (The SDK remaps the legacy wire key for this field when parsing responses.)
  backend_context?: Record<string, unknown>;

  // Forward-compatible
  [key: string]: unknown;
}

/**
 * A loaded fact in the enriched context (Layer 6).
 * Mirrors the AtomicFact shape serialized by the context builder.
 */
export interface ContextLoadedFact {
  fact_id?: string;
  atomic_text?: string;
  fact_type?: string;
  importance?: number;
  session_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

/**
 * A long-term summary in the enriched context (Layer 6).
 * Mirrors the LongTermSummary entity from the context engine.
 */
export interface ContextLongTermSummary {
  summary_type?: string;
  period_start?: string;
  summary?: string;
  topics?: string[];
  [key: string]: unknown;
}

/**
 * A proactive memory in the enriched context (Layer 6b).
 * Mirrors the ProactiveMemory entity from the context engine.
 */
export interface ContextProactiveMemory {
  fact?: ContextLoadedFact;
  urgency?: number;
  template?: string;
  [key: string]: unknown;
}

/**
 * A constellation pattern in the enriched context (Layer 6c).
 * Mirrors the ConstellationPattern entity from the context engine.
 */
export interface ContextConstellationPattern {
  type?: string;
  description?: string;
  significance?: number;
  mention_count?: number;
  [key: string]: unknown;
}

/** A single model variant offered by a provider. */
export interface ModelVariant {
  /** Model ID to pass as the `model` field in chat requests. */
  id: string;
  /** Human-readable model name suitable for display in a UI. */
  display_name: string;
}

export interface ModelsProviderEntry {
  provider: string;
  provider_name: string;
  default_model: string;
  /** All model variants available from this provider. */
  models: ModelVariant[];
}

export interface ModelsResponse {
  default_provider: string;
  default_model: string;
  providers: ModelsProviderEntry[];
}

export interface ProcessResponse {
  success: boolean;
  memories_created: number;
  facts_extracted: number;
  side_effects: ProcessSideEffectsSummary;
  /** Present only when `includeExtractions` was set to true in the request. */
  extractions?: SideEffectExtraction;
}

// ---------------------------------------------------------------------------
// Side-Effect Extraction (detailed extraction payload)
// ---------------------------------------------------------------------------

export interface ExtractionFact {
  text: string;
  fact_type: string;
  importance: number;
  entities: string[];
  sentiment: string;
  topic_tags: string[];
}

export interface ExtractionPersonalityDelta {
  trait: string;
  delta: number;
  reason: string;
}

export interface ExtractionDimensionDelta {
  dimension: string;
  delta: number;
  reason: string;
}

export interface ExtractionMoodDelta {
  happiness: number;
  energy: number;
  calmness: number;
  affection: number;
  reason: string;
}

export interface ExtractionHabit {
  name: string;
  category: string;
  description: string;
  is_reinforcement: boolean;
}

export interface ExtractionInterest {
  topic: string;
  category: string;
  confidence: number;
  engagement_level: number;
}

export interface ExtractionRelationshipDelta {
  score_change: number;
  reason: string;
}

export interface ExtractionProactive {
  type: string;
  description: string;
  delay_hours: number;
  intent: string;
}

export interface ExtractionRecurring {
  description: string;
  pattern: string;
  confidence: number;
}

export interface ExtractionInnerThoughts {
  diary: string;
  reflection: string;
}

export interface SideEffectExtraction {
  memory_facts: ExtractionFact[];
  personality_deltas: ExtractionPersonalityDelta[];
  dimension_deltas: ExtractionDimensionDelta[];
  mood_delta?: ExtractionMoodDelta;
  habit_observations: ExtractionHabit[];
  interests_detected: ExtractionInterest[];
  relationship_delta?: ExtractionRelationshipDelta;
  proactive_suggestions: ExtractionProactive[];
  recurring_events: ExtractionRecurring[];
  inner_thoughts?: ExtractionInnerThoughts;
  emotional_themes: string[];
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface EvalCategory {
  name: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  categories: EvalCategory[];
}

export interface EvaluateOptions {
  messages: ChatMessage[];
  templateId: string;
  configOverride?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Run Reference (async eval/simulation kickoff)
// ---------------------------------------------------------------------------

export interface RunRef {
  run_id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface SimulationEvent {
  type: string;
  session_index?: number;
  total_sessions?: number;
  total_turns?: number;
  total_cost_usd?: number;
  message?: string;
  eval_result?: Record<string, unknown>;
  adaptation_result?: Record<string, unknown>;
  error?: { message: string };
  [key: string]: unknown;
}

export interface SimulationSession {
  user_persona: string;
  turn_count: number;
  opening_message: string;
}

export interface UserPersona {
  id?: string;
  name: string;
  background: string;
  personality_traits: string[];
  communication_style: string;
}

export interface SimulationConfig {
  max_sessions?: number;
  max_turns_per_session?: number;
  simulated_duration_hours?: number;
  enable_proactive?: boolean;
  enable_diary?: boolean;
  enable_consolidation?: boolean;
}

export interface SimulateOptions {
  sessions?: SimulationSession[];
  userPersona?: UserPersona;
  config?: SimulationConfig;
  model?: string;
  configOverride?: Record<string, unknown>;
}

export interface RunEvalOptions {
  templateId: string;
  sessions?: SimulationSession[];
  userPersona?: UserPersona;
  simulationConfig?: SimulationConfig;
  model?: string;
  configOverride?: Record<string, unknown>;
  adaptationTemplateId?: string;
  qualityOnly?: boolean;
}

export interface EvalOnlyOptions {
  templateId: string;
  sourceRunId: string;
  adaptationTemplateId?: string;
  qualityOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Eval Templates
// ---------------------------------------------------------------------------

export interface EvalTemplateCategory {
  name: string;
  weight: number;
  criteria: string;
}

export interface EvalTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  template_type: string;
  judge_model: string;
  temperature: number;
  max_tokens: number;
  scoring_rubric: string;
  categories: EvalTemplateCategory[];
  created_at?: string;
  updated_at?: string;
}

// EvalTemplateListResponse is now re-exported from ./generated/aliases.js (as ListEvalTemplatesOutputBody)

export interface EvalTemplateCreateOptions {
  name: string;
  description?: string;
  templateType?: string;
  judgeModel?: string;
  temperature?: number;
  maxTokens?: number;
  scoringRubric?: string;
  categories?: EvalTemplateCategory[];
}

export interface EvalTemplateUpdateOptions {
  name?: string;
  description?: string;
  templateType?: string;
  judgeModel?: string;
  temperature?: number;
  maxTokens?: number;
  scoringRubric?: string;
  categories?: EvalTemplateCategory[];
}

// ---------------------------------------------------------------------------
// Eval Runs
// ---------------------------------------------------------------------------

export interface EvalRun {
  /** SDK alias. The spec wire name is `run_id`. */
  id: string;
  run_id?: string;
  tenant_id: string;
  project_id?: string;
  agent_id: string;
  agent_name: string;
  status: string;
  character_config: Record<string, unknown>;
  template_id: string;
  template_snapshot: Record<string, unknown>;
  simulation_config: Record<string, unknown>;
  simulation_model: string;
  user_persona: Record<string, unknown>;
  transcript: unknown[];
  evaluation_result: Record<string, unknown>;
  adaptation_result: Record<string, unknown>;
  simulation_state: Record<string, unknown>;
  total_sessions: number;
  total_turns: number;
  simulated_minutes: number;
  total_cost_usd: number;
  error_reason?: string;
  simulation_cost_usd?: number;
  evaluation_cost_usd?: number;
  adaptation_template_id?: string;
  adaptation_template_snapshot?: Record<string, unknown>;
  started_at?: string;
  created_at?: string;
  completed_at?: string;
}

// EvalRunListResponse is now re-exported from ./generated/aliases.js (as ListEvalRunsOutputBody)

export interface EvalRunListOptions {
  agentId?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Agent CRUD
// ---------------------------------------------------------------------------

export interface SDKPersonalityDimensions {
  intellect: number;
  aesthetic: number;
  industriousness: number;
  orderliness: number;
  enthusiasm: number;
  assertiveness: number;
  compassion: number;
  politeness: number;
  withdrawal: number;
  volatility: number;
}

export interface Big5Scores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  confidence?: number;
}

export interface AgentToolCapabilities {
  web_search: boolean;
  remember_name: boolean;
  image_generation: boolean;
  inventory: boolean;
}

export interface SeedMemory {
  content: string;
  fact_type?: string;
  importance?: number;
  entities?: string[];
}

export interface AgentFeatureCapabilities {
  image_generation: boolean;
  inventory: boolean;
}

export interface CreateAgentOptions {
  agentId?: string;
  userId?: string;
  userDisplayName?: string;
  name: string;
  gender?: string;
  bio?: string;
  avatarUrl?: string;
  projectId?: string;
  personalityPrompt?: string;
  speechPatterns?: string[];
  trueInterests?: string[];
  trueDislikes?: string[];
  primaryTraits?: string[];
  big5?: Big5Scores;
  dimensions?: SDKPersonalityDimensions;
  preferences?: Record<string, string>;
  behaviors?: Record<string, string>;
  capabilities?: AgentFeatureCapabilities;
  toolCapabilities?: AgentToolCapabilities;
  generateAvatar?: boolean;
  language?: string;
  seedMemories?: SeedMemory[];
  loreContext?: Record<string, unknown>;
  generateOriginStory?: boolean;
  generatePersonalizedMemories?: boolean;
  initialGoals?: InitialGoal[];
}

export interface Agent {
  agent_id: string;
  name: string;
  bio?: string;
  gender?: string;
  avatar_url?: string;
  status?: string;
  personality_prompt?: string;
  speech_patterns?: string[];
  true_interests?: string[];
  true_dislikes?: string[];
  created_at?: string;
}

export interface UpdateAgentOptions {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  personalityPrompt?: string;
  speechPatterns?: string[];
  trueInterests?: string[];
  trueDislikes?: string[];
  big5?: Big5Scores;
  dimensions?: SDKPersonalityDimensions;
  toolCapabilities?: AgentToolCapabilities;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface TriggerEventOptions {
  userId: string;
  eventType: string;
  eventDescription?: string;
  metadata?: Record<string, string>;
  language?: string;
  instanceId?: string;
  /**
   * Raw conversation messages that triggered this event.
   * When present, Platform API uses these directly for context-sensitive
   * generation (diary, summaries) instead of reconstructing from consolidation
   * summaries. Typically set by the orchestrator after a chat session ends.
   * Omit when triggering from cron jobs or other non-conversation sources.
   */
  messages?: ChatMessage[];
}

// TriggerEventResponse is now re-exported from ./generated/aliases.js (as TriggerEventOutputBody)

// ---------------------------------------------------------------------------
// Dialogue
// ---------------------------------------------------------------------------

export interface DialogueOptions {
  userId?: string;
  messages?: ChatMessage[];
  requestType?: string;
  sceneGuidance?: string;
  toolConfig?: Record<string, unknown>;
  instanceId?: string;
}

export interface DialogueResponse {
  response: string;
  side_effects?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Memory Facts
// ---------------------------------------------------------------------------

export interface Fact {
  fact_id: string;
  agent_id: string;
  user_id?: string;
  content: string;
  category: string;
  confidence: number;
  mention_count: number;
  created_at?: string;
  last_mentioned_at?: string;
  context_examples?: string[];
}

// FactListResponse is now re-exported from ./generated/aliases.js (as ListFactsResponse)

export interface FactListOptions {
  userId?: string;
  /** Filter by fact type (e.g. "relationship", "preference", "event", "interest"). */
  factType?: string;
  limit?: number;
  offset?: number;
}

export interface CreateFactOptions {
  content: string;
  userId?: string;
  factType?: string;
  importance?: number;
  confidence?: number;
  entities?: string[];
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateFactOptions {
  content?: string;
  factType?: string;
  importance?: number;
  confidence?: number;
  entities?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemoryResetOptions {
  userId: string;
  instanceId?: string;
}

export interface MemoryResetResponse {
  agent_id: string;
  user_id?: string;
  status: string;
  facts_deleted: number;
  relationships_deleted: number;
}

export interface SeedMemoriesOptions {
  userId: string;
  memories: SeedMemory[];
  instanceId?: string;
}

export interface SeedMemoriesResponse {
  memories_created: number;
}

// ---------------------------------------------------------------------------
// Personality Update
// ---------------------------------------------------------------------------

export interface PersonalityUpdateOptions {
  big5: Big5Scores;
  assessmentMethod?: string;
  totalExchanges?: number;
}

export interface PersonalityUpdateResponse {
  agent_id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------

/** Token for establishing a voice live WebSocket connection. */
export interface VoiceStreamToken {
  wsUrl: string;
  authToken: string;
}

/** Options for requesting a voice live WebSocket token. */
export interface VoiceTokenOptions {
  voiceName?: string;
  language?: string;
  userId?: string;
  compiledSystemPrompt?: string;
}

/** Usage statistics from the voice session. */
export interface VoiceUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Server event from the voice live WebSocket stream.
 *
 * Event types:
 * - "ready" — Go proxy authenticated the token
 * - "session_ready" — Gemini Live session established
 * - "input_transcript" — user speech transcript (streaming)
 * - "output_transcript" — agent speech transcript (streaming)
 * - "agent_state" — agent speaking/silent
 * - "turn_complete" — turn finished
 * - "tool_activity" — tool call status
 * - "side_effects" — extracted facts/emotions
 * - "usage" — token usage update
 * - "session_ended" — session closed
 * - "error" — error occurred
 * - "audio" — binary PCM audio data (24kHz, 16-bit, mono)
 */
export interface VoiceStreamEvent {
  type: string;
  sessionId?: string;
  /** Set on "input_transcript" and "output_transcript" events. */
  text?: string;
  /** Whether the transcript is final or interim. */
  isFinal?: boolean;
  /** Set on "agent_state" events. */
  speaking?: boolean;
  /** Set on "turn_complete" events. */
  turnIndex?: number;
  /** Set on "tool_activity" events — tool name. */
  name?: string;
  /** Set on "tool_activity" events — "called" or "resolved". */
  status?: string;
  /** Set on "side_effects" events. */
  facts?: unknown[];
  emotions?: unknown;
  relationshipDelta?: unknown;
  /** Set on "usage" events. */
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  /** Set on "session_ended" events. */
  reason?: string;
  totalUsage?: VoiceUsage;
  turnCount?: number;
  /** Set on "session_ready" events. */
  voiceName?: string;
  /** Set on "error" events. */
  error?: string;
  errorCode?: string;
  /** Raw binary PCM audio data (set when type is "audio"). */
  audio?: Uint8Array;
}

export interface VoiceEntry {
  voice_id: string;
  voice_name: string;
  gender: string;
  tier: number;
  provider: string;
  language: string;
  accent?: string;
  age_profile?: string;
  description?: string;
  sample_audio_url?: string;
  availability: string;
}

// VoiceListResponse is now re-exported from ./generated/aliases.js (as ListVoicesResponse)

export interface VoiceListOptions {
  tier?: number;
  gender?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Voice TTS/STT
// ---------------------------------------------------------------------------

/** Options for text-to-speech synthesis. */
export interface TTSOptions {
  /** Text to synthesize (1–5000 characters). */
  text: string;
  /** Gemini voice name (e.g., "Kore", "Puck"). Defaults to "Kore". */
  voiceName?: string;
  /** Language code (e.g., "en-US"). Defaults to "en-US". */
  language?: string;
  /** Output audio format. Defaults to "wav". */
  outputFormat?: "wav" | "opus";
}

/** Response from text-to-speech synthesis. */
export interface TTSResponse {
  /** Base64-encoded audio data. */
  audio: string;
  /** MIME type of the audio ("audio/wav" or "audio/ogg"). */
  contentType: string;
  /** Estimated audio duration in milliseconds. */
  durationMs?: number;
  /** Token usage for billing. */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
  };
}

/** Options for speech-to-text transcription. */
export interface STTOptions {
  /** Base64-encoded audio data. */
  audio: string;
  /** MIME type of the audio (e.g., "audio/wav", "audio/webm;codecs=opus"). */
  audioFormat: string;
  /** Language hint (e.g., "en-US"). */
  language?: string;
}

/** Response from speech-to-text transcription. */
export interface STTResponse {
  /** Transcribed text. */
  transcript: string;
  /** Confidence score (0.0–1.0). */
  confidence: number;
  /** Detected or confirmed language code. */
  languageCode?: string;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GenerateBioOptions {
  name?: string;
  gender?: string;
  description?: string;
  userId?: string;
  enrichedContextJson?: Record<string, unknown>;
  currentBio?: string;
  style?: string;
  instanceId?: string;
}

export interface GenerateBioResponse {
  bio: string;
  tone?: string;
  confidence?: number;
}

export interface GenerateCharacterOptions {
  /** Optional agent UUID. If omitted, a deterministic ID is derived from the name. */
  agentId?: string;
  name: string;
  gender?: string;
  description?: string;
  fields?: string[];
  /** LLM provider for generation ("gemini" | "openrouter" | "xai"). Platform defaults to gemini when omitted. */
  provider?: string;
  /** Optional model override for the chosen provider. */
  model?: string;
}

export interface SDKInteractionPreferences {
  conversation_pace: string;
  formality: string;
  humor_style: string;
  emotional_expression: string;
}

export interface SDKBehavioralTraits {
  response_length: string;
  question_frequency: string;
  empathy_style: string;
  conflict_approach: string;
}

export interface GeneratedGoal {
  type?: string;
  title: string;
  description: string;
  priority?: number;
}

export interface GenerateCharacterResponse {
  /** The resolved agent ID (provided or derived from name). */
  agent_id?: string;
  /** True when the agent already existed and the LLM was not called. */
  existing?: boolean;
  bio: string;
  personality_prompt: string;
  big5?: Big5Scores;
  speech_patterns?: string[];
  true_interests?: string[];
  true_dislikes?: string[];
  primary_traits?: string[];
  dimensions?: SDKPersonalityDimensions;
  preferences?: SDKInteractionPreferences;
  behaviors?: SDKBehavioralTraits;
  initial_goals?: GeneratedGoal[];
  world_description?: string;
  origin_prompt_instructions?: string;
}

export interface GenerateAndCreateOptions {
  /** Optional agent UUID. If omitted, a deterministic ID is derived from the name. */
  agentId?: string;
  name: string;
  gender?: string;
  description?: string;
  fields?: string[];
  projectId?: string;
  language?: string;
  /** LLM provider for generation ("gemini" | "openrouter" | "xai"). Platform defaults to gemini when omitted. */
  provider?: string;
  /** Optional model override for the chosen provider. */
  model?: string;
}

export interface GenerateAndCreateResponse {
  agent_id: string;
  name: string;
  /** True when the agent already existed and the LLM was skipped. */
  existing: boolean;
  /** Generated character fields (only present when existing=false). */
  generated?: Record<string, unknown>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model?: string;
  };
}

export interface LoreGenerationContext {
  worldDescription: string;
  entityTerminology?: Record<string, string>;
  originPromptInstructions?: string;
}

export interface IdentityMemory {
  template: string;
  factType?: string;
  importance?: number;
  entities?: string[];
}

export interface GenerateSeedMemoriesOptions {
  agentName?: string;
  big5?: Big5Scores;
  personalityPrompt?: string;
  primaryTraits?: string[];
  trueInterests?: string[];
  trueDislikes?: string[];
  speechPatterns?: string[];
  creatorDisplayName?: string;
  staticLoreMemories?: SeedMemory[];
  loreGenerationContext?: LoreGenerationContext;
  identityMemoryTemplates?: IdentityMemory[];
  generateOriginStory?: boolean;
  generatePersonalizedMemories?: boolean;
}

export interface GenerateSeedMemoriesResponse {
  memories: SeedMemory[];
  memories_stored?: number;
}

export interface ImageGenerateOptions {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  provider?: string;
}

export interface ImageGenerateResponse {
  image_id: string;
  public_url: string;
  mime_type: string;
  generation_time_ms: number;
}

// ---------------------------------------------------------------------------
// Custom States
// ---------------------------------------------------------------------------

export interface CustomStateListOptions {
  scope?: string;
  userId?: string;
  instanceId?: string;
}

export interface CustomStateCreateOptions {
  key: string;
  value: unknown;
  scope?: string;
  contentType?: string;
  userId?: string;
  instanceId?: string;
}

export interface CustomStateUpdateOptions {
  value: unknown;
  contentType?: string;
}

// CustomState is now re-exported from ./generated/aliases.js

// CustomStateListResponse is now re-exported from ./generated/aliases.js (as ListCustomStatesOutputBody)

export interface CustomStateUpsertOptions {
  key: string;
  value: unknown;
  scope?: string;
  contentType?: string;
  userId?: string;
  instanceId?: string;
}

export interface CustomStateGetByKeyOptions {
  key: string;
  scope?: string;
  userId?: string;
  instanceId?: string;
}

export interface CustomStateDeleteByKeyOptions {
  key: string;
  scope?: string;
  userId?: string;
  instanceId?: string;
}

// ---------------------------------------------------------------------------
// Wakeups
// ---------------------------------------------------------------------------

export interface ScheduleWakeupOptions {
  userId: string;
  checkType: string;
  intent: string;
  delayHours?: number;
}

// ScheduledWakeup is now re-exported from ./generated/aliases.js (as WakeupEntry)

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

// WebhookEndpoint is now re-exported from ./generated/aliases.js (as Webhook)

export interface WebhookRegisterOptions {
  webhookUrl: string;
  authHeader?: string;
}

export interface WebhookRegisterResponse {
  success: boolean;
  signing_secret?: string;
}

// WebhookListResponse is now re-exported from ./generated/aliases.js (as ListWebhooksOutputBody)

export interface WebhookDeliveryAttempt {
  attempt_id: string;
  event_type: string;
  webhook_url: string;
  response_code: number;
  response_body?: string;
  error_message?: string;
  duration_ms: number;
  attempt_number: number;
  status: string;
  created_at: string;
}

// DeliveryAttemptsResponse is now re-exported from ./generated/aliases.js (as ListDeliveryAttemptsOutputBody)

// ---------------------------------------------------------------------------
// Client Config
// ---------------------------------------------------------------------------

export interface SonzaiConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  defaultHeaders?: Record<string, string>;
  customFetch?: typeof fetch;
}

// ---------------------------------------------------------------------------
// Agent List (paginated)
// ---------------------------------------------------------------------------

export interface AgentListOptions {
  pageSize?: number;
  cursor?: string;
  search?: string;
  projectId?: string;
}

// AgentIndex is now re-exported from ./generated/aliases.js

// AgentListResponse is now re-exported from ./generated/aliases.js (as PaginatedAgentsResponse)

// ---------------------------------------------------------------------------
// Batch Personality
// ---------------------------------------------------------------------------

export interface BatchPersonalityEntry {
  profile: PersonalityProfile;
  evolution_count: number;
}

export interface BatchPersonalityResponse {
  personalities: Record<string, BatchPersonalityEntry>;
}

// ---------------------------------------------------------------------------
// Session Tools
// ---------------------------------------------------------------------------

export interface SetSessionToolsOptions {
  tools: ToolDefinition[];
}

// ---------------------------------------------------------------------------
// Personality Extensions
// ---------------------------------------------------------------------------

export interface SignificantMoment {
  agent_id?: string;
  moment_id?: string;
  timestamp?: string;
  description?: string;
  significance_score?: number;
  [key: string]: unknown;
}

export interface SignificantMomentsResponse {
  moments: SignificantMoment[];
}

export interface PersonalityShift {
  agent_id?: string;
  trait_name?: string;
  trait_category?: string;
  old_value?: number;
  new_value?: number;
  delta?: number;
  timestamp?: string;
  reason?: string;
  [key: string]: unknown;
}

// RecentShiftsResponse is now re-exported from ./generated/aliases.js

export interface UserPersonalityOverlay {
  agent_id: string;
  user_id: string;
  big5?: Big5;
  dimensions?: PersonalityDimensions;
  preferences?: PersonalityPreferences;
  behaviors?: PersonalityBehaviors;
  primary_traits?: string[];
  created_at?: string;
  updated_at?: string;
}

// UserOverlaysListResponse is now re-exported from ./generated/aliases.js

// UserOverlayDetailResponse is now re-exported from ./generated/aliases.js

export interface UserOverlayOptions {
  instanceId?: string;
  since?: string;
}

// ---------------------------------------------------------------------------
// Fact History
// ---------------------------------------------------------------------------

// FactHistoryResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Time Machine
// ---------------------------------------------------------------------------

export interface TimeMachineOptions {
  at: string; // RFC3339 timestamp
  userId?: string;
  instanceId?: string;
}

// TimeMachineMoodSnapshot is now re-exported from ./generated/aliases.js

// TimeMachineResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Agent Status
// ---------------------------------------------------------------------------

export interface SetStatusOptions {
  is_active: boolean;
}

// SetStatusResponse is now re-exported from ./generated/aliases.js (as SetAgentStatusOutputBody)

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

// PendingCapability is now re-exported from ./generated/aliases.js

// AgentCapabilities is now re-exported from ./generated/aliases.js

export interface UpdateCapabilitiesOptions {
  webSearch?: boolean;
  rememberName?: boolean;
  imageGeneration?: boolean;
  inventory?: boolean;
  knowledgeBase?: boolean;
}

// ---------------------------------------------------------------------------
// Custom Tools
// ---------------------------------------------------------------------------

// CustomToolDefinition is now re-exported from ./generated/aliases.js

// CustomToolListResponse is now re-exported from ./generated/aliases.js (as ListCustomToolsOutputBody)

export interface CreateCustomToolOptions {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface UpdateCustomToolOptions {
  description?: string;
  parameters?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Avatar Generation
// ---------------------------------------------------------------------------

export interface GenerateAvatarOptions {
  style?: string;
}

// GenerateAvatarResponse is now re-exported from ./generated/aliases.js (as RegenerateAvatarOutputBody)

// ---------------------------------------------------------------------------
// Consolidation
// ---------------------------------------------------------------------------

export interface ConsolidateOptions {
  period?: string;
  user_id?: string;
}

// ConsolidateResponse is now re-exported from ./generated/aliases.js (as TriggerConsolidationOutputBody)

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export interface SummariesOptions {
  period?: string;
  limit?: number;
}

export interface MemorySummary {
  agent_id?: string;
  stage?: string;
  summary_text?: string;
  timestamp?: string;
  fact_count?: number;
  confidence?: number;
  [key: string]: unknown;
}

// SummariesResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Update Project Association
// ---------------------------------------------------------------------------

export interface UpdateProjectOptions {
  project_id: string;
}

export interface UpdateProjectResponse {
  success: boolean;
  agent_id: string;
  project_id?: string;
}

// ---------------------------------------------------------------------------
// Update Instance
// ---------------------------------------------------------------------------

export interface UpdateInstanceOptions {
  name?: string;
  description?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Knowledge Base
// ---------------------------------------------------------------------------

// KBDocument is now re-exported from ./generated/aliases.js

// KBDocumentListResponse is now re-exported from ./generated/aliases.js (as KbListDocumentsOutputBody)

export interface KBNode {
  project_id: string;
  node_id: string;
  node_type: string;
  label: string;
  norm_label?: string;
  properties: Record<string, unknown>;
  source_type: string;
  version: number;
  is_active: boolean;
  confidence: number;
  created_at?: string;
  updated_at?: string;
}

// KBNodeListResponse is now re-exported from ./generated/aliases.js (as KbListNodesOutputBody)

// ----------------------------------------------------------------------------
// Organization-global KB (see docs/ORGANIZATION_GLOBAL_KB.md)
// ----------------------------------------------------------------------------

/**
 * KBScopeMode controls how an agent's knowledge_search reads across the
 * project and organization-global scopes.
 */
export type KBScopeMode = "project_only" | "org_only" | "cascade" | "union";

/** Wire-value constants for KBScopeMode — lock-in for cross-SDK compat. */
export const KBScope = {
  ProjectOnly: "project_only" as const,
  OrgOnly: "org_only" as const,
  Cascade: "cascade" as const,
  Union: "union" as const,
} satisfies Record<string, KBScopeMode>;

/** Request body for Knowledge.createOrgNode. */
export interface CreateOrgNodeOptions {
  node_type: string;
  label: string;
  properties?: Record<string, unknown>;
  /** 0.0–1.0. Defaults to 1.0 server-side for hand-authored org knowledge. */
  confidence?: number;
}

// KBNodeWithScope is now re-exported from ./generated/aliases.js

export interface KBEdge {
  project_id: string;
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
  confidence: number;
  created_at?: string;
  updated_at?: string;
}

export interface KBNodeHistory {
  project_id: string;
  node_id: string;
  version: number;
  properties: Record<string, unknown>;
  changed_by: string;
  change_type: string;
  changed_at?: string;
}

// KBNodeDetailResponse is now re-exported from ./generated/aliases.js (as KbGetNodeOutputBody)

// KBNodeHistoryResponse is now re-exported from ./generated/aliases.js (as KbGetNodeHistoryOutputBody)

// KBRelatedNode is now re-exported from ./generated/aliases.js

export interface KBSearchResult {
  node_id: string;
  node_type: string;
  label: string;
  properties: Record<string, unknown>;
  source: string;
  updated_at: string;
  score: number;
  related?: KBRelatedNode[];
  history?: KBNodeHistory[];
}

// KBSearchResponse is now re-exported from ./generated/aliases.js

export interface KBSearchOptions {
  query: string;
  limit?: number;
  includeHistory?: boolean;
  entityTypes?: string;
  filters?: string;
  hops?: number;
}

// KBSchemaField is now re-exported from ./generated/aliases.js

// KBSimilarityConfig is now re-exported from ./generated/aliases.js

// KBEntitySchema is now re-exported from ./generated/aliases.js

// KBSchemaListResponse is now re-exported from ./generated/aliases.js (as KbListSchemasOutputBody)

export interface KBStats {
  documents: {
    total: number;
    indexed: number;
    pending: number;
    failed: number;
  };
  nodes: { total: number; active: number };
  edges: number;
  extraction_tokens: number;
}

export interface InsertFactEntry {
  entity_type: string;
  label: string;
  properties?: Record<string, unknown>;
}

export interface InsertRelEntry {
  from_label: string;
  to_label: string;
  edge_type: string;
}

export interface InsertFactsOptions {
  source?: string;
  facts: InsertFactEntry[];
  relationships?: InsertRelEntry[];
}

export interface InsertFactDetail {
  label: string;
  type: string;
  action: "created" | "updated";
  node_id: string;
  version: number;
}

export interface InsertFactEdgeDetail {
  edge_id: string;
  from_node: string;
  to_node: string;
  relation: string;
}

// InsertFactsResponse is now re-exported from ./generated/aliases.js (as KbInsertFactsOutputBody)

export interface CreateSchemaOptions {
  entity_type: string;
  fields: KBSchemaField[];
  description?: string;
  similarity_config?: KBSimilarityConfig;
}

// KBAnalyticsRule is now re-exported from ./generated/aliases.js

// KBAnalyticsRuleListResponse is now re-exported from ./generated/aliases.js (as KbListAnalyticsRulesOutputBody)

export interface CreateAnalyticsRuleOptions {
  rule_type: "recommendation" | "trend";
  name: string;
  config: unknown;
  enabled: boolean;
  schedule?: string;
}

export interface UpdateAnalyticsRuleOptions {
  name?: string;
  config?: unknown;
  enabled: boolean;
  schedule?: string;
}

export interface KBRecommendationScore {
  project_id: string;
  rule_id: string;
  source_id: string;
  target_id: string;
  target_type: string;
  score: number;
}

// KBRecommendationsResponse is now re-exported from ./generated/aliases.js (as KbGetRecommendationsOutputBody)

// KBTrendAggregation is now re-exported from ./generated/aliases.js

// KBTrendsResponse is now re-exported from ./generated/aliases.js (as KbGetTrendsOutputBody)

// KBTrendRanking is now re-exported from ./generated/aliases.js

// KBTrendRankingsResponse is now re-exported from ./generated/aliases.js (as KbGetTrendRankingsOutputBody)

// KBConversionStats is now re-exported from ./generated/aliases.js

// KBConversionsResponse is now re-exported from ./generated/aliases.js (as KbGetConversionStatsOutputBody)

export interface RecordFeedbackOptions {
  source_node_id: string;
  target_node_id: string;
  rule_id: string;
  converted: boolean;
  score_at_time: number;
}

// ---------------------------------------------------------------------------
// User Priming
// ---------------------------------------------------------------------------

export interface PrimeContentBlock {
  type: string;
  body: string;
}

export interface PrimeUserMetadata {
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  /** IANA timezone (e.g. "Asia/Singapore"). */
  timezone?: string;
  custom?: Record<string, string>;
}

export interface UpdateMetadataOptions {
  display_name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  /** IANA timezone (e.g. "Asia/Singapore"). */
  timezone?: string;
  /**
   * Custom fields to merge into existing custom metadata.
   * Keys are merged, not replaced — existing keys not mentioned are preserved.
   * Omit to leave custom metadata unchanged.
   */
  custom?: Record<string, string>;
}

export interface StructuredColumnMapping {
  property: string;
  is_label?: boolean;
  type?: string;
}

export interface StructuredImportSpec {
  entity_type: string;
  content_csv: string;
  column_mapping: Record<string, StructuredColumnMapping>;
  project_id?: string;
}

export interface PrimeUserOptions {
  display_name?: string;
  metadata?: PrimeUserMetadata;
  content?: PrimeContentBlock[];
  source?: string;
  structured_import?: StructuredImportSpec;
}

export interface PrimeUserResponse {
  job_id: string;
  status: string;
  facts_created: number;
  rows_parsed?: number;
  kb_resolved?: number;
  unresolved?: number;
}

export interface AddContentOptions {
  content: PrimeContentBlock[];
  source?: string;
}

export interface AddContentResponse {
  job_id: string;
  status: string;
}

export interface UserPrimingMetadata {
  agent_id: string;
  user_id: string;
  display_name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  /** IANA timezone (e.g. "Asia/Singapore"). */
  timezone?: string;
  source_type?: string;
  custom_fields?: Record<string, string>;
  primed_at?: string;
}

export interface UpdateMetadataResponse {
  metadata: UserPrimingMetadata;
  facts_created: number;
}

export interface BatchImportUser {
  user_id: string;
  display_name?: string;
  metadata?: PrimeUserMetadata;
  content?: PrimeContentBlock[];
}

export interface BatchImportOptions {
  users: BatchImportUser[];
  source?: string;
}

export interface BatchImportResponse {
  job_id: string;
  status: string;
  total_users: number;
  facts_created: number;
}

export interface ImportJob {
  job_id: string;
  tenant_id?: string;
  agent_id?: string;
  job_type?: string;
  user_id?: string;
  source?: string;
  status: string;
  total_users?: number;
  processed_users?: number;
  facts_created?: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

// ImportJobListResponse is now re-exported from ./generated/aliases.js (as ListImportJobsOutputBody)

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export interface InventoryUpdateOptions {
  action: "add" | "update" | "remove";
  item_type: string;
  description?: string;
  kb_node_id?: string;
  properties?: Record<string, unknown>;
  project_id?: string;
}

// KBResolutionInfo is now re-exported from ./generated/aliases.js (as KbResolutionInfo)

// KBCandidate is now re-exported from ./generated/aliases.js (as KbCandidate)

export interface InventoryUpdateResponse {
  status: string;
  fact_id?: string;
  kb_resolution?: KBResolutionInfo;
  candidates?: KBCandidate[];
  error?: string;
}

export interface InventoryQueryOptions {
  mode?: "list" | "value" | "aggregate";
  item_type?: string;
  query?: string;
  project_id?: string;
  /** Structured metadata filtering, e.g. "grade:eq:mint,market_price:gte:100".
   *  Operators: eq, neq, gt, gte, lt, lte, in (pipe-separated values), contains. */
  filters?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  aggregations?: string;
  group_by?: string;
  limit?: number;
  offset?: number;
  /** Base64-encoded pagination cursor (takes precedence over offset). */
  cursor?: string;
  instanceId?: string;
}

export interface InventoryItem {
  fact_id: string;
  item_label: string;
  kb_node_id?: string;
  user_properties: Record<string, unknown>;
  market_properties?: Record<string, unknown>;
  gain_loss?: number;
}

export interface InventoryGroupResult {
  group: string;
  values: Record<string, unknown>;
}

export interface InventoryQueryResponse {
  items: InventoryItem[];
  total_items: number;
  next_cursor?: string;
  totals?: Record<string, unknown>;
  groups?: InventoryGroupResult[];
}

export interface InventoryBatchItem {
  item_type: string;
  description?: string;
  kb_node_id?: string;
  properties?: Record<string, unknown>;
}

export interface InventoryBatchImportOptions {
  items: InventoryBatchItem[];
  project_id?: string;
}

export interface InventoryBatchImportResponse {
  status: string;
  added: number;
  failed: number;
  total: number;
  error?: string;
}

export interface InventoryDirectUpdateOptions {
  properties: Record<string, unknown>;
}

export interface InventoryDirectUpdateResponse {
  status: string;
  fact_id?: string;
  error?: string;
}

export interface ListAllFactsOptions {
  has_metadata?: boolean;
  item_type?: string;
  limit?: number;
  instanceId?: string;
}

export interface ListAllFactsResponse {
  facts: StoredFact[];
  total: number;
}

export interface StoredFact {
  fact_id: string;
  content: string;
  fact_type: string;
  importance: number;
  confidence: number;
  entity?: string;
  source_type?: string;
  /**
   * Session that produced this fact, when attribution is known.
   * Empty for facts created outside a session (manual writes, agent-global
   * wisdom, pre-attribution writes). Clients can use this to map a retrieved
   * `fact_id` back to the conversation it came from without a follow-up call.
   */
  session_id?: string;
  /** Stable source identifier for the fact (e.g. the originating message). */
  source_id?: string;
  mention_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// KB Bulk Update
// ---------------------------------------------------------------------------

export interface KBBulkUpdateEntry {
  entity_type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface KBBulkUpdateOptions {
  source?: string;
  updates: KBBulkUpdateEntry[];
}

// KBBulkUpdateResponse is now re-exported from ./generated/aliases.js (as KbBulkUpdateOutputBody)

// ---------------------------------------------------------------------------
// Project Config
// ---------------------------------------------------------------------------

export interface ProjectConfigEntry {
  key: string;
  value: unknown;
  updated_at?: string;
}

export interface ProjectConfigListResponse {
  configs: ProjectConfigEntry[];
}

/**
 * Tenant-scoped config entry. Shape mirrors `ProjectConfigEntry` deliberately
 * so callers that already handle project config can reuse their serialisation.
 */
export interface AccountConfigEntry {
  key: string;
  value: unknown;
  updated_at?: string;
}

export interface AccountConfigListResponse {
  configs: AccountConfigEntry[];
}

/**
 * One entry in a post-processing model map — the cheaper model that
 * latency-insensitive batch work routes to when the agent's chat turn uses a
 * particular model. Sampling (temperature, maxTokens) is intentionally
 * omitted; the server inherits it from the chat ModelConfig.
 */
export interface PostProcessingModelEntry {
  provider: string;
  model: string;
}

/**
 * The full chat-model → post-processing-entry mapping stored under
 * `POST_PROCESSING_MODEL_MAP_KEY`. The `"*"` key is a wildcard fallback.
 */
export type PostProcessingModelMap = Record<string, PostProcessingModelEntry>;

export interface SetConfigOptions {
  value: unknown;
}

// ---------------------------------------------------------------------------
// Custom LLM
// ---------------------------------------------------------------------------

export interface CustomLLMConfigResponse {
  endpoint: string;
  api_key_prefix: string;
  model: string;
  display_name: string;
  is_active: boolean;
  configured: boolean;
}

export interface SetCustomLLMOptions {
  endpoint: string;
  api_key: string;
  model?: string;
  display_name?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Project Notifications
// ---------------------------------------------------------------------------

export interface ProjectNotificationListOptions {
  agentId?: string;
  eventType?: string;
  limit?: number;
}

export interface ProjectNotificationListResponse {
  notifications: Notification[];
  count: number;
}

export interface AcknowledgeNotificationsOptions {
  notificationIds: string[];
}

// AcknowledgeResponse is now re-exported from ./generated/aliases.js (as AcknowledgeProjectNotificationsOutputBody)

export interface AcknowledgeAllOptions {
  agentId?: string;
  eventType?: string;
}

// ---------------------------------------------------------------------------
// Agent Knowledge Search (tool endpoint)
// ---------------------------------------------------------------------------

export interface AgentKBSearchOptions {
  query: string;
  limit?: number;
}

export interface AgentKBSearchResult {
  content: string;
  label: string;
  type: string;
  source: string;
  score: number;
}

export interface AgentKBSearchResponse {
  query: string;
  results: AgentKBSearchResult[];
}

// ---------------------------------------------------------------------------
// Tool Schemas (BYO-LLM)
// ---------------------------------------------------------------------------

/** Describes a single tool available for an agent (BYO-LLM integrations). */
export interface ToolSchema {
  name: string;
  description: string;
  endpoint: string;
  parameters?: Record<string, unknown>;
}

/** Response from the getTools endpoint. */
export interface ToolSchemasResponse {
  tools: ToolSchema[];
}

// ---------------------------------------------------------------------------
// Fork
// ---------------------------------------------------------------------------

export interface ForkAgentOptions {
  /** Display name for the forked agent. */
  name?: string;
}

// ForkResponse is now re-exported from ./generated/aliases.js

// ForkStatusResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Wisdom
// ---------------------------------------------------------------------------

// DeleteWisdomResponse is now re-exported from ./generated/aliases.js

// WisdomAuditResponse is now re-exported from ./generated/aliases.js

// ---------------------------------------------------------------------------
// Platform models
// ---------------------------------------------------------------------------

/** Response from `GET /api/v1/models`. */
export interface PlatformModelsResponse {
  /** The platform's overall default model ID. */
  default_model: string;
  /** Enabled LLM providers and their available model variants. */
  providers: ModelsProviderEntry[];
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

// Project is now re-exported from ./generated/aliases.js

export interface ProjectListResponse {
  projects?: Project[] | null;
}

// ProjectAPIKey is now re-exported from ./generated/aliases.js

export interface ProjectAPIKeyListResponse {
  keys?: ProjectAPIKey[] | null;
}

export interface CreateProjectOptions {
  name: string;
  environment?: string;
}

export interface UpdateProjectDetailsOptions {
  name?: string;
  gameName?: string;
  environment?: string;
}

export interface DeleteProjectResponse {
  status: string;
}

export interface CreateAPIKeyOptions {
  name?: string;
  expiresDays?: number;
  scopes?: string[];
}

export interface CreateAPIKeyResponse {
  key_id: string;
  project_id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  key: string;
  is_active: boolean;
  scopes?: string[] | null;
  created_at: string;
  created_by?: string;
  expires_at?: string;
}

export interface RevokeAPIKeyResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// User Personas (API resource)
// ---------------------------------------------------------------------------

// UserPersonaRecord is now re-exported from ./generated/aliases.js

export interface UserPersonaListResponse {
  personas?: UserPersonaRecord[] | null;
}

export interface CreateUserPersonaOptions {
  name: string;
  description?: string;
  style?: string;
}

export interface UpdateUserPersonaOptions {
  name?: string;
  description?: string;
  style?: string;
}

export interface DeleteUserPersonaResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// Tool Schemas (distinct from custom tool list)
// ---------------------------------------------------------------------------

// ToolSchemaEntry is now re-exported from ./generated/aliases.js

export interface GetToolSchemasResponse {
  tools?: ToolSchemaEntry[] | null;
}

// ---------------------------------------------------------------------------
// Workbench
// ---------------------------------------------------------------------------
//
// Mirrors the Go handler structs in
// services/platform/api/internal/delivery/http/workbench_advance_time.go.
// The AdvanceTime endpoint accepts async=true and returns a 202 body of
// shape AdvanceTimeJob; poll GetAdvanceTimeJob until status is terminal.

export interface AdvanceTimeOptions {
  agentId: string;
  userId: string;
  simulatedHours: number;
  simulatedBaseOffsetHours?: number;
  instanceId?: string;
  characterConfig?: Record<string, unknown>;
  /** When true, server returns 202 + job_id. Poll getAdvanceTimeJob. */
  runAsync?: boolean;
}

export interface WakeupExecution {
  wakeup_id?: string;
  check_type?: string;
  intent?: string;
  user_id?: string;
  agent_id?: string;
  /** Populated only when the proactive message generator is wired in. */
  generated_message?: string;
  [key: string]: unknown;
}

export interface AdvanceTimeResponse {
  days_processed?: number;
  consolidation_ran?: boolean;
  weekly_consolidations?: number;
  diary_entries_created?: number;
  diary_entries?: DiaryEntry[] | null;
  wakeups_executed?: WakeupExecution[] | null;
  consolidation_processed?: number;
  [key: string]: unknown;
}

/**
 * 202 response body returned when AdvanceTime is invoked with async=true,
 * and the body returned by getAdvanceTimeJob. State lives in Redis with a
 * 30-minute TTL and terminal statuses carry either `result` or `error`.
 */
export interface AdvanceTimeJob {
  job_id: string;
  status: "running" | "succeeded" | "failed";
  result?: AdvanceTimeResponse;
  error?: string;
  [key: string]: unknown;
}

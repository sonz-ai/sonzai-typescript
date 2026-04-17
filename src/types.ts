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
  message_count?: number;
  side_effects?: Record<string, unknown>;
  external_tool_calls?: ExternalToolCall[];
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
  requestType?: string;
  language?: string;
  compiledSystemPrompt?: string;
  interactionRole?: string;
  timezone?: string;
  toolCapabilities?: AgentToolCapabilities;
  toolDefinitions?: ToolDefinition[];
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
  supersedes_id: string;
  session_id: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface MemoryResponse {
  nodes: MemoryNode[];
  contents: Record<string, AtomicFact[]>;
}

export interface MemorySearchResult {
  fact_id: string;
  content: string;
  fact_type: string;
  score: number;
}

export interface MemorySearchResponse {
  results: MemorySearchResult[];
}

export interface TimelineSession {
  session_id: string;
  facts: AtomicFact[];
  first_fact_at?: string;
  last_fact_at?: string;
  fact_count: number;
}

export interface MemoryTimelineResponse {
  sessions: TimelineSession[];
  total_facts: number;
}

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
  created_at?: string;
}

export interface PersonalityDelta {
  delta_id: string;
  change: string;
  reason: string;
  created_at?: string;
}

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
  sessionId: string;
  instanceId?: string;
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

export interface NotificationListResponse {
  notifications: Notification[];
}

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
  happiness: number;
  energy: number;
  calmness: number;
  affection: number;
}

export interface MoodResponse {
  mood: MoodState;
  updated_at?: string;
}

export interface MoodHistoryEntry {
  mood: MoodState;
  timestamp: string;
}

export interface MoodHistoryResponse {
  history: MoodHistoryEntry[];
}

export interface MoodAggregateResponse {
  average: MoodState;
  min: MoodState;
  max: MoodState;
  data_count: number;
}

export interface RelationshipData {
  user_id: string;
  love_score: number;
  narrative?: string;
  last_update?: string;
}

export interface RelationshipResponse {
  relationships: RelationshipData[];
}

export interface HabitData {
  name: string;
  strength: number;
  category?: string;
  last_update?: string;
}

export interface HabitsResponse {
  habits: HabitData[];
}

// ---------------------------------------------------------------------------
// Habits (CRUD)
// ---------------------------------------------------------------------------

export interface Habit {
  id?: string;
  agent_id: string;
  user_id?: string;
  name: string;
  category: string;
  description: string;
  display_name?: string;
  strength: number;
  formed: boolean;
  observation_count: number;
  last_reinforced_at?: string;
  formed_at?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface Goal {
  goal_id: string;
  agent_id: string;
  user_id?: string;
  type: GoalType;
  title: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  related_traits?: string[];
  created_at: string;
  achieved_at?: string;
  updated_at: string;
}

export interface GoalsResponse {
  goals: Goal[];
}

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
  score: number;
  category?: string;
}

export interface InterestsResponse {
  interests: InterestData[];
}

export interface DiaryEntry {
  entry_id: string;
  title: string;
  body: string;
  tags?: string[];
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
  node_type: string;
  label: string;
  description?: string;
  significance: number;
  mention_count: number;
  brightness: number;
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

export interface Breakthrough {
  breakthrough_id: string;
  agent_id: string;
  user_id: string;
  breakthrough_number: number;
  level_at_breakthrough: number;
  narrative: string;
  personality_shifts: string[];
  trait_evolved?: string;
  new_goals: string[];
  achieved_goals: string[];
  skill_points_awarded: number;
  acknowledged: boolean;
  created_at: string;
}

export interface BreakthroughsResponse {
  breakthroughs: Breakthrough[];
}

export interface WakeupsResponse {
  wakeups: ScheduledWakeup[];
}

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
  big5?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  behaviors?: Record<string, unknown>;

  // Layer 3: Evolution
  recent_personality_shifts?: unknown[];
  significant_moments?: unknown[];
  active_goals?: unknown[];
  habits?: unknown[];
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
  current_mood?: Record<string, unknown>;
  emotional_state?: string;
  capabilities?: Record<string, unknown>;

  // Layer 6: Memory
  loaded_facts?: Array<Record<string, unknown>>;
  long_term_summaries?: unknown[];

  // Layer 6b: Proactive
  proactive_memories?: unknown[];

  // Layer 6c: Constellation
  constellation_patterns?: unknown[];

  // Layer 7: Backend Context
  // (The SDK remaps the legacy wire key for this field when parsing responses.)
  backend_context?: Record<string, unknown>;

  // Forward-compatible
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

export interface EvalTemplateListResponse {
  templates: EvalTemplate[];
}

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
  id: string;
  tenant_id: string;
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
  created_at?: string;
  completed_at?: string;
}

export interface EvalRunListResponse {
  runs: EvalRun[];
  total_count: number;
}

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
  toolCapabilities?: AgentToolCapabilities;
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

export interface TriggerEventResponse {
  accepted: boolean;
  event_id: string;
}

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

export interface FactListResponse {
  facts: Fact[];
  total_count: number;
  has_more: boolean;
}

export interface FactListOptions {
  userId?: string;
  category?: string;
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
  userId?: string;
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

export interface VoiceListResponse {
  voices: VoiceEntry[];
  total_count: number;
  has_more: boolean;
}

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
  userId?: string;
  agentName?: string;
  big5?: Big5Scores;
  personalityPrompt?: string;
  guideSummary?: string;
  trueInterests?: string[];
  trueDislikes?: string[];
  speechPatterns?: string[];
  creatorDisplayName?: string;
  staticLoreMemories?: SeedMemory[];
  loreGenerationContext?: LoreGenerationContext;
  identityMemoryTemplates?: IdentityMemory[];
  generateOriginStory?: boolean;
  generatePersonalizedMemories?: boolean;
  storeMemories?: boolean;
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

export interface CustomState {
  state_id: string;
  agent_id: string;
  scope: string;
  key: string;
  value: unknown;
  content_type: string;
  user_id?: string;
  instance_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomStateListResponse {
  states: CustomState[];
}

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
  scheduledAt: string;
  checkType: string;
  intent?: string;
  occasion?: string;
  interestTopic?: string;
  eventDescription?: string;
}

export interface ScheduledWakeup {
  wakeup_id: string;
  agent_id: string;
  user_id: string;
  scheduled_at: string;
  check_type: string;
  status: string;
  intent?: string;
  last_topic?: string;
  event_description?: string;
  occasion?: string;
  interest_topic?: string;
  executed_at?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export interface WebhookEndpoint {
  event_type: string;
  webhook_url: string;
  auth_header?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface WebhookRegisterOptions {
  webhookUrl: string;
  authHeader?: string;
}

export interface WebhookRegisterResponse {
  success: boolean;
  signing_secret?: string;
}

export interface WebhookListResponse {
  webhooks: WebhookEndpoint[];
}

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

export interface DeliveryAttemptsResponse {
  attempts: WebhookDeliveryAttempt[];
}

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

export interface AgentIndex {
  id: string;
  tenant_id?: string;
  name: string;
  bio?: string;
  gender?: string;
  avatar_url?: string;
  status?: string;
  project_id?: string;
  created_at?: string;
}

export interface AgentListResponse {
  items: AgentIndex[];
  next_cursor?: string;
  has_more: boolean;
}

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

export interface RecentShiftsResponse {
  shifts: PersonalityShift[];
}

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

export interface UserOverlaysListResponse {
  overlays: UserPersonalityOverlay[];
}

export interface UserOverlayDetailResponse {
  overlay: UserPersonalityOverlay;
  base: PersonalityProfile;
  evolution: PersonalityShift[];
}

export interface UserOverlayOptions {
  instanceId?: string;
  since?: string;
}

// ---------------------------------------------------------------------------
// Fact History
// ---------------------------------------------------------------------------

export interface FactHistoryResponse {
  current: AtomicFact;
  previous_versions: AtomicFact[];
}

// ---------------------------------------------------------------------------
// Time Machine
// ---------------------------------------------------------------------------

export interface TimeMachineOptions {
  at: string; // RFC3339 timestamp
  userId?: string;
  instanceId?: string;
}

export interface TimeMachineMoodSnapshot {
  valence?: number;
  arousal?: number;
  tension?: number;
  affiliation?: number;
  label?: string;
}

export interface TimeMachineResponse {
  personality_at?: Record<string, unknown>;
  current_personality?: Record<string, unknown>;
  evolution_events?: PersonalityShift[];
  mood_at?: TimeMachineMoodSnapshot;
  requested_at?: string;
}

// ---------------------------------------------------------------------------
// Agent Status
// ---------------------------------------------------------------------------

export interface SetStatusOptions {
  is_active: boolean;
}

export interface SetStatusResponse {
  success: boolean;
  agent_id: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export interface AgentCapabilities {
  webSearch: boolean;
  rememberName: boolean;
  imageGeneration: boolean;
  inventory: boolean;
  customTools?: CustomToolDefinition[];
}

export interface UpdateCapabilitiesOptions {
  webSearch?: boolean;
  rememberName?: boolean;
  imageGeneration?: boolean;
  inventory?: boolean;
}

// ---------------------------------------------------------------------------
// Custom Tools
// ---------------------------------------------------------------------------

export interface CustomToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface CustomToolListResponse {
  tools: CustomToolDefinition[];
}

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

export interface GenerateAvatarResponse {
  success: boolean;
  avatar_url: string;
  prompt: string;
  generation_time_ms: number;
}

// ---------------------------------------------------------------------------
// Consolidation
// ---------------------------------------------------------------------------

export interface ConsolidateOptions {
  period?: string;
  user_id?: string;
}

export interface ConsolidateResponse {
  success: boolean;
}

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

export interface SummariesResponse {
  summaries: MemorySummary[];
}

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

export interface KBDocument {
  project_id: string;
  document_id: string;
  file_name: string;
  content_type: string;
  file_size: number;
  gcs_path: string;
  checksum: string;
  status: "pending" | "parsing" | "extracting" | "indexed" | "failed";
  uploaded_by?: string;
  extraction_tokens?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KBDocumentListResponse {
  documents: KBDocument[];
  total: number;
}

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

export interface KBNodeListResponse {
  nodes: KBNode[];
  total: number;
  next_cursor?: string;
}

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

export interface KBNodeDetailResponse {
  node: KBNode;
  outgoing: KBEdge[];
  incoming: KBEdge[];
  history: KBNodeHistory[];
}

export interface KBNodeHistoryResponse {
  history: KBNodeHistory[];
  total: number;
}

export interface KBRelatedNode {
  node_id: string;
  label: string;
  node_type: string;
  edge_type: string;
  properties?: Record<string, unknown>;
}

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

export interface KBSearchResponse {
  query: string;
  results: KBSearchResult[];
  total: number;
}

export interface KBSearchOptions {
  query: string;
  limit?: number;
  includeHistory?: boolean;
  entityTypes?: string;
  filters?: string;
  hops?: number;
}

export interface KBSchemaField {
  name: string;
  type: string;
  required?: boolean;
}

export interface KBSimilarityConfig {
  match_fields?: string[];
  threshold?: number;
}

export interface KBEntitySchema {
  project_id: string;
  schema_id: string;
  entity_type: string;
  fields: KBSchemaField[];
  description?: string;
  similarity_config?: KBSimilarityConfig;
  created_at?: string;
  updated_at?: string;
}

export interface KBSchemaListResponse {
  schemas: KBEntitySchema[];
  total: number;
}

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

export interface InsertFactsResponse {
  processed: number;
  created: number;
  updated: number;
  details: InsertFactDetail[];
  edges?: InsertFactEdgeDetail[];
}

export interface CreateSchemaOptions {
  entity_type: string;
  fields: KBSchemaField[];
  description?: string;
  similarity_config?: KBSimilarityConfig;
}

export interface KBAnalyticsRule {
  project_id: string;
  rule_id: string;
  rule_type: "recommendation" | "trend";
  name: string;
  config: unknown;
  enabled: boolean;
  schedule?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KBAnalyticsRuleListResponse {
  rules: KBAnalyticsRule[];
  total: number;
}

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

export interface KBRecommendationsResponse {
  recommendations: KBRecommendationScore[];
  total: number;
}

export interface KBTrendAggregation {
  project_id: string;
  node_id: string;
  rule_id: string;
  window: string;
  value: number;
  direction: string;
}

export interface KBTrendsResponse {
  trends: KBTrendAggregation[];
  total: number;
}

export interface KBTrendRanking {
  project_id: string;
  node_id: string;
  rule_id: string;
  type: string;
  window: string;
  rank: number;
  score: number;
}

export interface KBTrendRankingsResponse {
  rankings: KBTrendRanking[];
  total: number;
}

export interface KBConversionStats {
  project_id: string;
  rule_id: string;
  segment_key: string;
  target_type: string;
  shown_count: number;
  conversion_count: number;
  conversion_rate: number;
}

export interface KBConversionsResponse {
  conversions: KBConversionStats[];
  total: number;
}

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

export interface ImportJobListResponse {
  jobs: ImportJob[];
  count: number;
}

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

export interface KBResolutionInfo {
  resolved: boolean;
  kb_node_id?: string;
  kb_label?: string;
  kb_properties?: Record<string, unknown>;
}

export interface KBCandidate {
  kb_node_id: string;
  label: string;
  properties?: Record<string, unknown>;
}

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

export interface KBBulkUpdateResponse {
  processed?: number;
  updated?: number;
  not_found?: number;
  created?: number;
  status?: string;
  count?: number;
}

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

export interface AcknowledgeResponse {
  acknowledged: number;
}

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
// Platform models
// ---------------------------------------------------------------------------

/** Response from `GET /api/v1/models`. */
export interface PlatformModelsResponse {
  /** The platform's overall default model ID. */
  default_model: string;
  /** Enabled LLM providers and their available model variants. */
  providers: ModelsProviderEntry[];
}

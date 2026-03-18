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

export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface ChatOptions {
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
  warmth: number;
  energy: number;
  openness: number;
  emotional_depth: number;
  playfulness: number;
  supportiveness: number;
  curiosity: number;
  wisdom: number;
}

export interface PersonalityPreferences {
  pace: string;
  formality: string;
  humor_style: string;
  emotional_expression: string;
}

export interface PersonalityBehaviors {
  proactivity: string;
  reliability: string;
  humor: string;
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

export interface MoodResponse extends Record<string, unknown> {}
export interface MoodAggregateResponse extends Record<string, unknown> {}
export interface RelationshipResponse extends Record<string, unknown> {}
export interface HabitsResponse extends Record<string, unknown> {}
export interface GoalsResponse extends Record<string, unknown> {}
export interface InterestsResponse extends Record<string, unknown> {}
export interface DiaryResponse extends Record<string, unknown> {}
export interface UsersResponse extends Record<string, unknown> {}
export interface ConstellationResponse extends Record<string, unknown> {}
export interface BreakthroughsResponse extends Record<string, unknown> {}
export interface WakeupsResponse extends Record<string, unknown> {}

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
}

export interface EvalOnlyOptions {
  templateId: string;
  sourceRunId: string;
  adaptationTemplateId?: string;
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
  warmth: number;
  energy: number;
  openness: number;
  emotional_depth: number;
  playfulness: number;
  supportiveness: number;
  curiosity: number;
  wisdom: number;
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
  enrichedContext?: Record<string, unknown>;
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

export interface VoiceMatchOptions {
  big5?: Big5Scores;
  preferredGender?: string;
}

export interface VoiceMatchResponse {
  voice_id: string;
  voice_name: string;
  match_score: number;
  reasoning?: string;
}

export interface EmotionalContext {
  themes?: string[];
  tone?: string;
}

export interface TTSOptions {
  text: string;
  voiceName?: string;
  language?: string;
  emotionalContext?: EmotionalContext;
}

export interface TTSResponse {
  audio: string;
  content_type: string;
  voice_name?: string;
  duration_ms?: number;
}

export interface VoiceChatOptions {
  userId?: string;
  audio: string;
  audioFormat?: string;
  voiceName?: string;
  continuationToken?: string;
  language?: string;
}

export interface VoiceChatResponse {
  transcript: string;
  response: string;
  audio: string;
  content_type: string;
  continuation_token?: string;
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
  name: string;
  gender?: string;
  description?: string;
  fields?: string[];
}

export interface SDKInteractionPreferences {
  pace: string;
  formality: string;
  humor_style: string;
  emotional_expression: string;
}

export interface SDKBehavioralTraits {
  proactivity: string;
  reliability: string;
  humor: string;
}

export interface GenerateCharacterResponse {
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

export interface ModelConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
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
  modelConfig?: ModelConfig;
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
  outputBucket?: string;
  outputPath?: string;
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
}

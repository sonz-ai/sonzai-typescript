export { Sonzai } from "./client.js";
export * as providers from "./providers.js";
export { VoiceStreamInstance } from "./resources/voice.js";
export type { ScheduleUpcomingOptions } from "./resources/schedules.js";

// Errors
export {
  SonzaiError,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
  PermissionDeniedError,
  RateLimitError,
  InternalServerError,
  APIError,
  StreamError,
} from "./errors.js";

// All spec-derived types — auto-maintained from openapi.json.
// New types added to the API appear here automatically after `just sync-spec`.
export type * from "./generated/flat-exports.js";

// SDK-specific types: options, config, streaming, and types where the hand-written
// version differs from (or extends) the spec schema.
export type {
  // Config
  SonzaiConfig,
  // Agent CRUD
  Agent,
  CreateAgentOptions,
  UpdateAgentOptions,
  SDKPersonalityDimensions,
  Big5Scores,
  AgentToolCapabilities,
  AgentFeatureCapabilities,
  SeedMemory,
  // Chat
  ChatMessage,
  ChatChoice,
  ChatUsage,
  ChatStreamEvent,
  ChatResponse,
  ChatOptions,
  GameContext,
  // Dialogue
  DialogueOptions,
  DialogueResponse,
  // Events
  TriggerEventOptions,
  // Memory (hand-written — differs from spec)
  MemoryNode,
  AtomicFact,
  MemoryResponse,
  TimelineSession,
  MemoryListOptions,
  MemorySearchOptions,
  MemoryTimelineOptions,
  Fact,
  FactListOptions,
  CreateFactOptions,
  UpdateFactOptions,
  MemoryResetOptions,
  MemoryResetResponse,
  SeedMemoriesOptions,
  SeedMemoriesResponse,
  // Personality (hand-written SDK types)
  Big5Trait,
  Big5,
  PersonalityDimensions,
  PersonalityPreferences,
  PersonalityBehaviors,
  PersonalityProfile,
  PersonalityResponse,
  PersonalityGetOptions,
  PersonalityUpdateOptions,
  PersonalityUpdateResponse,
  // Sessions
  SessionStartOptions,
  SessionEndOptions,
  SessionResponse,
  // Instances
  AgentInstance,
  InstanceListResponse,
  InstanceCreateOptions,
  // Notifications
  Notification,
  NotificationListOptions,
  // Context data options
  ContextDataOptions,
  MoodState,
  MoodHistoryEntry,
  CreateHabitOptions,
  UpdateHabitOptions,
  DeleteHabitOptions,
  GoalType,
  GoalStatus,
  GoalPriority,
  CreateGoalOptions,
  UpdateGoalOptions,
  DeleteGoalOptions,
  InitialGoal,
  DiaryResponse,
  DiaryEntry,
  UsersResponse,
  ConstellationResponse,
  ConstellationNode,
  CreateConstellationNodeOptions,
  UpdateConstellationNodeOptions,
  // Context (single-call enriched context)
  GetContextOptions,
  EnrichedContextResponse,
  ContextLoadedFact,
  ContextLongTermSummary,
  ContextProactiveMemory,
  ContextConstellationPattern,
  // Process
  ProcessOptions,
  ProcessResponse,
  ProcessSideEffectsSummary,
  // Side-Effect Extraction
  SideEffectExtraction,
  ExtractionFact,
  ExtractionPersonalityDelta,
  ExtractionDimensionDelta,
  ExtractionMoodDelta,
  ExtractionHabit,
  ExtractionInterest,
  ExtractionRelationshipDelta,
  ExtractionProactive,
  ExtractionRecurring,
  ExtractionInnerThoughts,
  ModelVariant,
  ModelsResponse,
  ModelsProviderEntry,
  PlatformModelsResponse,
  // Tool definitions & tool calls
  ToolDefinition,
  ExternalToolCall,
  ToolCallResponseOptions,
  // Voice
  VoiceStreamToken,
  VoiceTokenOptions,
  VoiceStreamEvent,
  VoiceUsage,
  VoiceEntry,
  VoiceListOptions,
  // Voice TTS/STT
  TTSOptions,
  TTSResponse,
  STTOptions,
  STTResponse,
  // Generation
  GenerateBioOptions,
  GenerateBioResponse,
  GenerateCharacterOptions,
  GenerateCharacterResponse,
  GeneratedGoal,
  SDKInteractionPreferences,
  SDKBehavioralTraits,
  GenerateSeedMemoriesOptions,
  GenerateSeedMemoriesResponse,
  LoreGenerationContext,
  IdentityMemory,
  ImageGenerateOptions,
  ImageGenerateResponse,
  // Custom States options
  CustomStateListOptions,
  CustomStateCreateOptions,
  CustomStateUpdateOptions,
  CustomStateUpsertOptions,
  CustomStateGetByKeyOptions,
  CustomStateDeleteByKeyOptions,
  // Wakeups options
  ScheduleWakeupOptions,
  // Webhooks options
  WebhookRegisterOptions,
  WebhookRegisterResponse,
  // Evaluation
  EvalCategory,
  EvaluationResult,
  EvaluateOptions,
  // Simulation
  SimulationEvent,
  SimulationSession,
  UserPersona,
  SimulationConfig,
  SimulateOptions,
  RunEvalOptions,
  EvalOnlyOptions,
  RunRef,
  // Eval templates
  EvalTemplateCategory,
  EvalTemplate,
  EvalTemplateCreateOptions,
  EvalTemplateUpdateOptions,
  // Eval runs
  EvalRun,
  EvalRunListOptions,
  // Agent list options
  AgentListOptions,
  // Batch personality (hand-written)
  BatchPersonalityEntry,
  BatchPersonalityResponse,
  // Session tools
  SetSessionToolsOptions,
  // Personality extensions (hand-written)
  SignificantMoment,
  SignificantMomentsResponse,
  PersonalityShift,
  UserPersonalityOverlay,
  UserOverlayOptions,
  // Time machine options
  TimeMachineOptions,
  // Agent status options
  SetStatusOptions,
  // Capabilities options
  UpdateCapabilitiesOptions,
  // Avatar Generation options
  GenerateAvatarOptions,
  // Custom tools options
  CreateCustomToolOptions,
  UpdateCustomToolOptions,
  // Consolidation options
  ConsolidateOptions,
  // Summaries options
  SummariesOptions,
  MemorySummary,
  // Project association
  UpdateProjectOptions,
  UpdateProjectResponse,
  // Instance update
  UpdateInstanceOptions,
  // Agent Knowledge Search (tool endpoint)
  AgentKBSearchOptions,
  AgentKBSearchResult,
  AgentKBSearchResponse,
  // Tool Schemas (BYO-LLM)
  ToolSchema,
  ToolSchemasResponse,
  // Fork options
  ForkAgentOptions,
  // Knowledge Base (hand-written — differ from spec or SDK-specific)
  KBNode,
  KBEdge,
  KBNodeHistory,
  KBScopeMode,
  CreateOrgNodeOptions,
  KBSearchResult,
  KBSearchOptions,
  KBStats,
  InsertFactEntry,
  InsertRelEntry,
  InsertFactsOptions,
  InsertFactDetail,
  InsertFactEdgeDetail,
  CreateSchemaOptions,
  CreateAnalyticsRuleOptions,
  UpdateAnalyticsRuleOptions,
  KBRecommendationScore,
  RecordFeedbackOptions,
  // User Priming
  PrimeUserMetadata,
  PrimeContentBlock,
  PrimeUserOptions,
  PrimeUserResponse,
  AddContentOptions,
  AddContentResponse,
  UserPrimingMetadata,
  UpdateMetadataOptions,
  UpdateMetadataResponse,
  BatchImportUser,
  BatchImportOptions,
  BatchImportResponse,
  ImportJob,
  StructuredColumnMapping,
  StructuredImportSpec,
  // Inventory
  InventoryUpdateOptions,
  InventoryUpdateResponse,
  InventoryQueryOptions,
  InventoryQueryResponse,
  InventoryItem,
  InventoryGroupResult,
  InventoryBatchItem,
  InventoryBatchImportOptions,
  InventoryBatchImportResponse,
  InventoryDirectUpdateOptions,
  InventoryDirectUpdateResponse,
  ListAllFactsOptions,
  ListAllFactsResponse,
  StoredFact,
  // KB Bulk Update
  KBBulkUpdateEntry,
  KBBulkUpdateOptions,
  // Project Config
  ProjectConfigEntry,
  ProjectConfigListResponse,
  SetConfigOptions,
  // Custom LLM
  CustomLLMConfigResponse,
  SetCustomLLMOptions,
  // Project Notifications
  ProjectNotificationListOptions,
  ProjectNotificationListResponse,
  AcknowledgeNotificationsOptions,
  AcknowledgeAllOptions,
  // Projects
  ProjectListResponse,
  ProjectAPIKeyListResponse,
  CreateProjectOptions,
  UpdateProjectDetailsOptions,
  DeleteProjectResponse,
  CreateAPIKeyOptions,
  CreateAPIKeyResponse,
  RevokeAPIKeyResponse,
  // User Personas options
  UserPersonaListResponse,
  CreateUserPersonaOptions,
  UpdateUserPersonaOptions,
  DeleteUserPersonaResponse,
  // Tool Schemas (BYO-LLM, distinct from custom tool list)
  GetToolSchemasResponse,
  // Workbench
  AdvanceTimeOptions,
  AdvanceTimeResponse,
  AdvanceTimeJob,
  WakeupExecution,
} from "./types.js";

// Runtime value exports (non-type)
export { KBScope } from "./types.js";

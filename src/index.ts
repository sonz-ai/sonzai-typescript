export { Sonzai } from "./client.js";

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

// Types
export type {
  // Config
  SonzaiConfig,
  // Chat
  ChatMessage,
  ChatChoice,
  ChatUsage,
  ChatStreamEvent,
  ChatResponse,
  ChatOptions,
  // Memory
  MemoryNode,
  AtomicFact,
  MemoryResponse,
  MemorySearchResult,
  MemorySearchResponse,
  TimelineSession,
  MemoryTimelineResponse,
  MemoryListOptions,
  MemorySearchOptions,
  MemoryTimelineOptions,
  // Personality
  Big5Trait,
  Big5,
  PersonalityDimensions,
  PersonalityPreferences,
  PersonalityBehaviors,
  PersonalityProfile,
  PersonalityDelta,
  PersonalityResponse,
  PersonalityGetOptions,
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
  NotificationListResponse,
  NotificationListOptions,
  // Context data
  ContextDataOptions,
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
  // Eval templates
  EvalTemplateCategory,
  EvalTemplate,
  EvalTemplateListResponse,
  EvalTemplateCreateOptions,
  EvalTemplateUpdateOptions,
  // Eval runs
  EvalRun,
  EvalRunListResponse,
  EvalRunListOptions,
} from "./types.js";

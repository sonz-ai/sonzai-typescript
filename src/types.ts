// Re-export all spec-derived types so resource files can import from this module
// without knowing about the generated layer.
export type * from "./generated/flat-exports.js";
// Cursor-paginated response aliases that aren't part of the raw flat-exports.
export type {
	EvalRunListResponse,
	DeliveryAttemptsResponse,
} from "./generated/aliases.js";

// Import spec types used in hand-written interface bodies below.
import type {
	Goal,
	KBCandidate,
	KBRelatedNode,
	KBResolutionInfo,
	KBSchemaField,
	KBSimilarityConfig,
	OmnichannelConversationDTO,
	OmnichannelMessageDTO,
	PersonalityDelta,
	Project,
	ProjectAPIKey,
	ToolSchemaEntry,
	UserPersonaRecord,
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

	/**
	 * iter-140u-1 progressive elaboration. Populated on type=phase
	 * frames. Values: planning | tool_call | composing | verifying |
	 * complete. Lets clients show progress while the model is silent
	 * (LLM warmup, tool calls, post-stream verification). Naive
	 * consumers can ignore phase events — they carry no `choices` or
	 * `content`.
	 */
	phase?: string;

	/**
	 * Tool name on phase=tool_call frames (e.g. "sonzai_inventory",
	 * "memory_search"). Empty on other phase values.
	 */
	tool?: string;
}

export interface ChatResponse {
	content: string;
	sessionId: string;
	usage?: ChatUsage;
}

/**
 * iter-140u-2: immediate 202 Accepted return shape for
 * `POST /agents/{id}/chat/async`. The caller stores `processingId`
 * and polls `pollChatResult(...)` (or uses `chatAsyncBlocking`).
 */
export interface ChatAsyncResponse {
	processingId: string;
	status: string;
}

/**
 * iter-140u-2: JSON shape returned by
 * `GET /agents/{id}/chat/result/{processingId}`.
 *
 * - status: queued | running | complete | failed
 * - response: accumulated assistant text (partial mid-flight, final
 *   on complete; on a deadline-aborted complete this is the
 *   best-effort partial answer)
 * - phase: latest progressive-elaboration phase (iter-140u-1)
 * - tool: latest tool name on phase=tool_call (sticky)
 * - sideEffects: terminal-chunk side-effects payload
 * - error: populated only on status=failed
 */
export interface ChatAsyncResult {
	status: string;
	response?: string;
	phase?: string;
	tool?: string;
	sideEffects?: unknown;
	error?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ExternalToolCall {
	id: string;
	name: string;
	parameters?: Record<string, unknown>;
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
	/**
	 * Optional sampling temperature for this chat turn. Leave unset to
	 * inherit the AI service's per-model default (currently 0.1 for most
	 * models).
	 *
	 * The Platform automatically adapts or omits this value for providers
	 * whose models require it. Callers do not need to know provider-
	 * specific constraints — pass the value you want, and the Platform
	 * will silently reconcile it where necessary. `temperature: 0` is
	 * forwarded as a literal zero.
	 */
	temperature?: number;
	skipContextBuild?: boolean;
	gameContext?: GameContext;
	skillLevels?: Record<string, number>;
}

/**
 * Default detached call timeout (5 minutes). The upper bound applied to
 * detached streaming calls when {@link DetachOptions.timeoutMs} is omitted.
 *
 * AI generations rarely exceed a couple of minutes, but the 5-minute
 * ceiling tolerates a slow LLM, a retrying upstream, or a long
 * tool-use chain while still guaranteeing the call eventually returns
 * instead of leaking a fetch.
 */
export const DEFAULT_DETACHED_TIMEOUT_MS = 300_000;

/**
 * Minimal logger shape accepted by {@link DetachOptions}. Compatible with
 * `console`, pino, winston, or any structured logger that exposes a
 * `warn(message, meta?)` method.
 */
export interface DetachLogger {
	warn: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Tunes the `*Detached` chat variants on {@link Agents}.
 *
 * All fields are optional. The zero-config call runs with
 * {@link DEFAULT_DETACHED_TIMEOUT_MS} and emits a `console.warn` if a
 * supplied parent signal fires mid-stream.
 */
export interface DetachOptions {
	/**
	 * Caps the detached call. Omit to fall back to
	 * {@link DEFAULT_DETACHED_TIMEOUT_MS} (5 minutes). Pass a value `<= 0`
	 * to disable the SDK-managed timeout entirely — rarely what you want,
	 * prefer an explicit cap.
	 */
	timeoutMs?: number;

	/**
	 * Optional parent {@link AbortSignal}. The detached method watches
	 * this signal so it can surface a warning if the caller's request
	 * lifecycle ends while the AI generation is still running, but it
	 * deliberately does NOT propagate cancellation to the underlying
	 * fetch — that is the whole point of the detached helpers.
	 */
	parentSignal?: AbortSignal;

	/**
	 * Overrides the default `console.warn` logger used to surface the
	 * misuse warning when `parentSignal` fires during the call.
	 */
	logger?: DetachLogger;

	/**
	 * Invoked instead of the default logger warning when `parentSignal`
	 * fires while the detached call is still running. Fires at most once
	 * per call, and only if the underlying call has not already
	 * completed. Useful for routing the condition to metrics or
	 * structured tracing rather than logs alone.
	 */
	onParentCancel?: () => void;
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
	memory_type?: string;
}

export interface MemorySearchOptions {
	query: string;
	instanceId?: string;
	limit?: number;
	user_id?: string;
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

/**
 * A single Big Five personality trait.
 *
 * `score` is on the 0-100 canonical scale that the platform stores natively.
 * The API permissively accepts 0-1 fractional inputs on writes (auto-rescaled
 * to 0-100), but reads always return 0-100.
 */
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
	userDisplayName?: string;
	userTimezone?: string;
	/** When true, run CE pipeline synchronously before responding. Useful for test harnesses that query memory immediately after session end. */
	wait?: boolean;
	/** Caps how long end() will poll the /sessions/end/status/{pid} endpoint
	 *  before giving up with a timeout error. Only consulted when the server
	 *  is in ENABLE_ASYNC_SESSION_END=true mode (returns a processing_id).
	 *  Default: 900000 ms (15 minutes). */
	pollTimeoutMs?: number;
}

export interface SessionResponse {
	success: boolean;
}

// ---------------------------------------------------------------------------
// Turn (realtime API: POST /agents/{id}/sessions/{sid}/turn)
// ---------------------------------------------------------------------------

export interface TurnToolCallFunction {
	name: string;
	arguments: string;
}

export interface TurnToolCall {
	id: string;
	type: string;
	function: TurnToolCallFunction;
}

export interface TurnMessage {
	role: string;
	content?: string;
	tool_call_id?: string;
	tool_calls?: TurnToolCall[];
}

export interface TurnFetchNextContext {
	/** Optional supplementary memory-search query used by the context builder. */
	query?: string;
	/** Optional language code (e.g. en, ja). */
	language?: string;
	/** Optional IANA timezone. */
	timezone?: string;
}

export interface TurnMoodDelta {
	valence: number;
	arousal: number;
	tension: number;
	affiliation: number;
	trigger_type?: string;
	reason?: string;
}

export interface TurnOptions {
	/** New-turn messages (just the latest exchange — not the full history). Tool messages allowed. */
	messages: TurnMessage[];
	/** Override per-call user_id; falls back to the Session's userId when omitted. */
	userId?: string;
	userDisplayName?: string;
	userTimezone?: string;
	instanceId?: string;
	/** Per-call provider override; falls back to session-level default, then server-side resolver. */
	provider?: string;
	/** Per-call model override; falls back to session-level default, then server-side resolver. */
	model?: string;
	/** When set, /turn fetches enriched context and returns it under next_context. */
	fetchNextContext?: TurnFetchNextContext;
}

export interface TurnResponse {
	success: boolean;
	/** Idempotency key for the deferred pipeline. Poll via GET /agents/{id}/turns/{extractionId}/status. */
	extraction_id: string;
	/** "queued" right after submit; the worker transitions through running → done|failed. */
	extraction_status: string;
	/** Sync mood-only extraction. Absent when the analyzer didn't produce a mood update. */
	mood?: TurnMoodDelta;
	/** Enriched agent context. Present only when fetchNextContext was supplied on the request. */
	next_context?: unknown;
}

export interface TurnStatusResponse {
	extraction_id: string;
	/** queued | running | done | failed */
	state: string;
	error?: string;
}

/** Options for opening a Session handle. Adds optional provider/model
 *  defaults applied to every turn() / end() unless overridden per-call. */
export interface SessionHandleStartOptions extends SessionStartOptions {
	/** Default LLM provider used for /turn calls in this session. Per-call provider on .turn() overrides. */
	provider?: string;
	/** Default LLM model used for /turn calls in this session. Per-call model on .turn() overrides. */
	model?: string;
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
	/** LLM model for extraction (e.g. "gemini-3-flash", "gpt-4o-mini"). Falls back to platform default. */
	model?: string;
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

	/**
	 * Raw messages buffered by `/process` for the current session.
	 * Chronological order (oldest first). Empty when the buffer is cold or
	 * `/process` hasn't been called yet this session.
	 *
	 * Closes the latency gap between a fact being said this turn and that
	 * fact becoming searchable via the consolidated fact pipeline. The
	 * OpenClaw plugin renders this as a "Recent Context" section so the
	 * agent can recall same-session statements before extraction completes.
	 */
	recent_turns?: RecentTurn[];

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
 * A raw message from the current session, buffered by /process and
 * exposed via /context.recent_turns. Chronological order.
 */
export interface RecentTurn {
	role: string; // "user" | "assistant" | "system"
	content: string; // raw message content as the SDK consumer sent it
	timestamp: string; // RFC3339 UTC, set by backend on Push
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
	facts_extracted: number;
	side_effects: ProcessSideEffectsSummary;
	/** Session identifier echoed by the server (auto-generated when not provided in the request). */
	session_id?: string;
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
	pageSize?: number;
	cursor?: string;
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

/**
 * Raw Big5 personality scores for create/update payloads.
 *
 * Canonical scale is 0-100. Values <=1 are accepted permissively as 0-1
 * fractions (e.g. 0.85 → 85) for backward compatibility with legacy clients.
 */
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
	/** Inventory aggregate-compute tools (sonzai_inventory + sonzai_inventory_update). Server default ON; pass false to disable. */
	inventory?: boolean;
	/** Enable the knowledge_search tool (reads from the agent's project-scoped KB). */
	knowledge_base?: boolean;
	/**
	 * Supplementary memory recall timing. `"sync"` (default) blocks context
	 * build until recall returns so facts land in the current turn. `"async"`
	 * lets the recall race a deadline — slow hits spill to the next turn for
	 * lower first-token latency.
	 */
	memory_mode?: "sync" | "async";
}

export interface SeedMemory {
	content: string;
	fact_type?: string;
	importance?: number;
	entities?: string[];
}

export interface AgentFeatureCapabilities {
	image_generation: boolean;
	/** Inventory aggregate-compute tools (count/sum/avg). Server default ON; pass false to disable. */
	inventory?: boolean;
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
	/**
	 * Initial per-agent proactive-messaging mode:
	 * - `"full"` (default): all wakeup types fire.
	 * - `"scheduled_only"`: only tenant-defined reminder schedules fire.
	 * - `"off"`: no proactive outreach of any kind.
	 */
	proactiveMode?: "full" | "scheduled_only" | "off";
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

export interface BulkFactItem {
	content: string;
	userId?: string;
	factType?: string;
	importance?: number;
	confidence?: number;
	entities?: string[];
	nodeId?: string;
	metadata?: Record<string, unknown>;
}

export interface BulkCreateFactsOptions {
	facts: BulkFactItem[];
	userId?: string;
	instanceId?: string;
}

export interface BulkCreateFactsResponse {
	facts_created: number;
	facts: AtomicFact[];
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
	delayHours: number;
	scheduled_at?: string;
	occasion?: string;
	interest_topic?: string;
	event_description?: string;
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

// -- Notification Channels --

/** A notification channel (webhook / email / composio delivery target). */
export interface Channel {
	channel_id: string;
	project_id: string;
	name: string;
	type: "webhook" | "email" | "composio";
	config: Record<string, unknown>;
	events: string[];
	filter?: Record<string, unknown>;
	active: boolean;
	created_at: string;
	updated_at: string;
}

/** Request body for creating or updating a notification channel. */
export interface ChannelWriteOptions {
	name: string;
	type: "webhook" | "email" | "composio";
	config?: Record<string, unknown>;
	events?: string[];
	filter?: Record<string, unknown>;
	active?: boolean;
}

/** Response shape for `GET /api/v1/channels`. */
export interface ChannelListResponse {
	channels: Channel[];
}

/** Known notification channel event types. */
export const CHANNEL_EVENTS = {
	BUILTIN_AGENT_COMPLETED: "builtin_agent.completed",
	LEAD_ENRICHED: "lead.enriched",
} as const;

export type ChannelEventType = (typeof CHANNEL_EVENTS)[keyof typeof CHANNEL_EVENTS];

// -- Omnichannel Conversations --

export interface ConversationListOptions {
	projectId?: string;
	channel?: string;
	agentId?: string;
	userId?: string;
	controller?: "agent" | "human" | string;
	status?: "open" | "snoozed" | "closed" | string;
	q?: string;
	cursor?: string;
	limit?: number;
}

export interface ConversationMessageListOptions {
	cursor?: string;
	limit?: number;
}

export interface ConversationStreamOptions {
	projectId?: string;
}

export interface ConversationStreamEvent {
	type?: ConversationWebhookEventType | string;
	event?: ConversationWebhookEventType | string;
	conversation_id?: string;
	conversation?: OmnichannelConversationDTO;
	message?: OmnichannelMessageDTO;
	data?: Record<string, unknown>;
	error?: { message: string };
	[key: string]: unknown;
}

export interface ConversationTakeOverOptions {
	operatorId?: string;
	force?: boolean;
}

export interface ConversationSendAsAgentOptions {
	content: string;
	attachments?: unknown;
}

export interface ConversationUpdateOptions {
	agentId?: string;
	status?: "open" | "snoozed" | "closed";
}

export const CONVERSATION_WEBHOOK_EVENTS = {
	STARTED: "conversation.started",
	MESSAGE: "conversation.message",
	TAKEOVER_STARTED: "conversation.takeover.started",
	TAKEOVER_RELEASED: "conversation.takeover.released",
	MESSAGE_FAILED: "conversation.message.failed",
	UNROUTED: "conversation.unrouted",
} as const;

export type ConversationWebhookEventType =
	(typeof CONVERSATION_WEBHOOK_EVENTS)[keyof typeof CONVERSATION_WEBHOOK_EVENTS];

// -- Meta Channel Connections --

export type ChannelConnectionProviderMode = "byo_app" | "embedded_signup";
export type MetaChannelType = "whatsapp" | "messenger" | "instagram";

export interface ChannelConnectionCreateOptions {
	channelType: MetaChannelType;
	providerMode: ChannelConnectionProviderMode;
	appId?: string;
	appSecret?: string;
	phoneNumberId?: string;
	wabaId?: string;
	pageId?: string;
	igAccountId?: string;
	accessToken?: string;
	verifyToken?: string;
	displayName?: string;
	defaultAgentId?: string;
	code?: string;
	templates?: unknown;
	testTo?: string;
	testMessage?: string;
}

export interface ChannelConnectionUpdateOptions {
	defaultAgentId?: string;
	status?: string;
	templates?: unknown;
}

export interface ChannelConnectionTestOptions {
	to: string;
	message: string;
}

export interface BYOKKeyResponse {
	provider: string;
	api_key_prefix?: string;
	is_active: boolean;
	health_status?: string;
	last_health_check_at?: string;
	updated_at?: string;
}

// -- Custom Agents --

/** A project-scoped custom agent definition. */
export interface CustomAgent {
	agent_id: string;
	project_id: string;
	slug: string;
	name: string;
	description?: string;
	model: string;
	system: string;
	findings_schema?: Record<string, unknown>;
	tools: string[];
	disable_tools: boolean;
	max_tool_rounds: number;
	created_at: string;
	updated_at: string;
}

/** Request body for creating or updating a custom agent. */
export interface CustomAgentInput {
	slug: string;
	name: string;
	description?: string;
	model: string;
	system: string;
	findings_schema?: Record<string, unknown>;
	tools?: string[];
	disable_tools?: boolean;
	max_tool_rounds?: number;
}

/** Response shape for `GET /api/v1/custom-agents`. */
export interface CustomAgentListResponse {
	agents: CustomAgent[];
}

// -- Pipelines --

/** A single step in a pipeline. */
export interface PipelineStep {
	slug: string;
	title?: string;
}

/** A project-scoped pipeline definition. */
export interface Pipeline {
	pipeline_id: string;
	project_id: string;
	name: string;
	description?: string;
	steps: PipelineStep[];
	created_at: string;
	updated_at: string;
}

/** Request body for creating or updating a pipeline. */
export interface PipelineInput {
	name: string;
	description?: string;
	steps?: PipelineStep[];
}

/** Result of a single pipeline step within a run. */
export interface PipelineStepResult {
	slug: string;
	title?: string;
	findings: unknown;
	summary?: string;
	cost_usd: number;
	error?: string;
}

/**
 * Result of executing a pipeline. Runs are asynchronous: `run()` enqueues a
 * run and returns this shape with `status: "queued"`; poll `getRun()` until
 * `status` is `"completed"` or `"failed"`.
 */
export interface PipelineRun {
	run_id: string;
	pipeline_id: string;
	/** queued | running | completed | failed */
	status: string;
	steps: PipelineStepResult[];
	final_findings: unknown;
	total_cost_usd: number;
	completed: boolean;
	/** Populated only when status is "failed". */
	error?: string;
	created_at?: string;
	updated_at?: string;
}

/** Response shape for `GET /api/v1/pipelines/{id}/runs`. */
export interface PipelineRunListResponse {
	runs: PipelineRun[];
}

/** Response shape for `GET /api/v1/pipelines`. */
export interface PipelineListResponse {
	pipelines: Pipeline[];
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
	runtimeBaseUrl?: string;
	runtimeApiKey?: string;
	runtimeTenantId?: string;
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
	/** Allow the agent to add, update, and soft-delete KB entries (read-then-write CAS). Requires `knowledgeBase`. */
	knowledgeBaseWrite?: boolean;
	/**
	 * How the agent reads across project and organization-global KB scopes.
	 * - `project_only` (default): read only the agent's own project KB.
	 * - `cascade`: read both scopes; project wins on ID collisions.
	 * - `union`: read both scopes; first occurrence wins on collisions.
	 * - `org_only`: skip the project scope entirely; read only org-global.
	 */
	knowledgeBaseScopeMode?: "project_only" | "org_only" | "cascade" | "union";
	/** Per-agent Composio SaaS integrations (Gmail, GCal, Slack, GitHub, Linear, Notion, GDrive). */
	composio?: boolean;
	/** Base wisdom (cross-user generalization). Default ON for new agents — pass `false` to opt out. Required precondition for `sharedMemory`. */
	wisdom?: boolean;
	/** Person/entity-attributed memory shared across users of this agent (teams, parties, business context). Off by default; requires `wisdom`. */
	sharedMemory?: boolean;
	/** Project-library skill loading via `sonzai_load_skill`. Required precondition for `autoLearnSkills`. */
	skills?: boolean;
	/** Agent-authored skills (`sonzai_create_skill` / `sonzai_update_skill`). Requires `skills`. */
	autoLearnSkills?: boolean;
	/** IDs of project MCP catalog entries this agent uses. */
	mcpEnabled?: string[];
	/**
	 * Supplementary memory recall timing. `"sync"` (default) blocks context
	 * build until recall returns so facts land in the current turn. `"async"`
	 * lets the recall race a deadline — slow hits spill to the next turn for
	 * lower first-token latency.
	 */
	memoryMode?: "sync" | "async";
	/**
	 * Per-agent proactive-messaging mode:
	 * - `"full"` (default): all wakeup types fire (fallback, mood, follow-up,
	 *   celebration, interest research, reminder).
	 * - `"scheduled_only"`: only tenant-defined reminder schedules fire; the
	 *   agent never decides to reach out on its own.
	 * - `"off"`: no wakeup of any type fires, including reminders.
	 *
	 * Omitted = no change.
	 */
	proactiveMode?: "full" | "scheduled_only" | "off";
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
	display_name?: string;
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
	action?: string;
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
	label?: string;
}

// KBResolutionInfo is now re-exported from ./generated/aliases.js (as KbResolutionInfo)

// KBCandidate is now re-exported from ./generated/aliases.js (as KbCandidate)

export interface InventoryUpdateResponse {
	status: string;
	fact_id?: string;
	inventory_item_id?: string;
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
	inventory_item_id?: string;
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
	label?: string;
}

export interface InventoryBatchImportOptions {
	items: InventoryBatchItem[];
	project_id?: string;
}

/** Options for the dedicated inventory-item create endpoint (POST .../inventory/items).
 *  Equivalent to InventoryUpdateOptions with action:"add" but without requiring the action field. */
export interface InventoryCreateItemOptions {
	item_type: string;
	description?: string;
	label?: string;
	kb_node_id?: string;
	properties?: Record<string, unknown>;
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
	upsert?: boolean;
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
	items: Project[];
	next_cursor?: string;
	has_more: boolean;
}

// ProjectAPIKey is now re-exported from ./generated/aliases.js

export interface ProjectAPIKeyListResponse {
	keys?: ProjectAPIKey[] | null;
}

export interface CreateProjectOptions {
	name: string;
	environment?: string;
	/**
	 * Project-level default for whether agents in this project may autonomously
	 * edit the knowledge base (knowledge_create / _update / _delete tools).
	 * OR-resolved with each agent's own `knowledgeBaseWrite` capability — agent
	 * flag true wins; only when off does this default apply. `null`/`undefined`
	 * = not configured (no default).
	 */
	defaultAgentKbWrite?: boolean | null;
}

export interface UpdateProjectDetailsOptions {
	name?: string;
	/**
	 * Display name surfaced in admin/storefront UIs. `gameName` is the legacy
	 * alias retained for backwards compatibility; new code should set
	 * `businessName`.
	 */
	businessName?: string;
	/** @deprecated Use `businessName`. */
	gameName?: string;
	environment?: string;
	/** See `CreateProjectOptions.defaultAgentKbWrite`. */
	defaultAgentKbWrite?: boolean | null;
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

// ---------------------------------------------------------------------------
// Sonzai Built-in Agents
// ---------------------------------------------------------------------------
//
// Platform-hosted vertical task agents invoked by slug. Invocations are
// billed per token plus runtime at the tenant's billing mode.

/**
 * Known built-in agent slugs. The catalog is server-driven, so any string
 * is accepted — this union exists for editor completions.
 */
export type BuiltinAgentSlug =
	| "lead_research"
	| "market_intel"
	| "lead_extract"
	| "lead_score"
	| "lead_qualifier"
	// `string & {}` keeps literal completions while accepting new
	// server-added slugs.
	| (string & {});

/** Catalog entry returned by GET /builtin-agents. */
export interface BuiltinAgentSummary {
	slug: string;
	name: string;
	description: string;
	model: string;
	/** Whether the agent is provisioned (ready to invoke) for this tenant. */
	provisioned: boolean;
}

export interface BuiltinAgentListResponse {
	agents: BuiltinAgentSummary[];
}

/** Token usage for a built-in agent invocation or chat turn. */
export interface BuiltinAgentUsage {
	input_tokens: number;
	output_tokens: number;
	cache_creation_input_tokens: number;
	cache_read_input_tokens: number;
}

/** Final result of a built-in agent invocation. */
export interface BuiltinAgentInvokeResult {
	/** Structured findings produced by the agent (shape is agent-specific). */
	findings: unknown;
	summary: string;
	session_id: string;
	model: string;
	byok: boolean;
	usage: BuiltinAgentUsage;
	running_seconds: number;
	cost_usd: number;
}

/** Progress frame emitted on the `update` SSE channel while an agent runs. */
export interface BuiltinAgentUpdate {
	type:
		| "status"
		| "thinking"
		| "message"
		| "tool_use"
		| "tool_result"
		| "findings"
		| "usage"
		| "error";
	tool?: string;
	text?: string;
	detail?: unknown;
	/** Seconds elapsed since the invocation started. */
	elapsed?: number;
}

export interface BuiltinAgentInvokeOptions {
	/** Agent-specific input payload (see the catalog entry's description). */
	input: Record<string, unknown>;
	/** Optional human-readable title for the resulting session. */
	title?: string;
}

export interface BuiltinAgentInvokeStreamOptions
	extends BuiltinAgentInvokeOptions {
	/** Called for every `update` frame while the agent runs. */
	onUpdate?: (update: BuiltinAgentUpdate) => void | Promise<void>;
}

/** A built-in agent session (one invocation or chat thread). */
export interface BuiltinAgentSession {
	id: string;
	agent: string;
	model: string;
	status: string;
	title: string;
	byok: boolean;
	cost_usd: number;
	created_at: string;
}

/** Session detail (GET /builtin-agents/sessions/{id}) with billed-token totals. */
export interface BuiltinAgentSessionDetail extends BuiltinAgentSession {
	billed_input_tokens: number;
	billed_output_tokens: number;
	billed_cache_read_tokens: number;
	billed_cache_creation_tokens: number;
}

export interface BuiltinAgentSessionListResponse {
	sessions: BuiltinAgentSession[];
}

export interface CreateBuiltinAgentSessionOptions {
	/** Slug of the built-in agent to bind the session to. */
	agent: BuiltinAgentSlug;
	title?: string;
}

export interface BuiltinAgentSessionListOptions {
	limit?: number;
}

/** Result of a single follow-up chat turn in a built-in agent session. */
export interface BuiltinAgentChatTurnResult {
	reply: string;
	findings?: unknown;
	usage: BuiltinAgentUsage;
	turn_cost_usd: number;
	running_seconds: number;
}

export interface BuiltinAgentSendOptions {
	text: string;
	/** Called for every `update` frame while the turn runs. */
	onUpdate?: (update: BuiltinAgentUpdate) => void | Promise<void>;
}

export interface BuiltinAgentSendBlockingOptions {
	text: string;
}

/** Raw lead payload submitted for async enrichment (all fields optional). */
export interface EnrichLeadInput {
	name?: string;
	phone?: string;
	email?: string;
	company?: string;
	brand?: string;
	vertical?: string;
	raw?: string;
}

export interface EnrichLeadParams {
	/** Raw lead payload to enrich. */
	lead: EnrichLeadInput;
	/** Optional callback URL invoked when the job completes. */
	webhookUrl?: string;
}

/**
 * State of an async lead-enrichment job. `status` moves
 * `queued` → `processing` → `done` (or `error`). When `done`, `result`
 * carries the rich, evolving enrichment object (identity, affiliations,
 * current_location, net_worth, score, band, intent, value,
 * recommended_brand, next_best_action, recommended_message, …).
 */
export interface EnrichJob {
	job_id: string;
	status: string;
	result?: Record<string, unknown>;
	error?: string;
}

// ---------------------------------------------------------------------------
// Sonzai ML — generalized, multi-tenant ML & RL primitives
// ---------------------------------------------------------------------------
//
// The ML resource exposes the platform's generalized, multi-tenant /
// multi-vertical ML & RL primitives: supervised scoring (train + calibrated
// predict), contextual-bandit next-best-action (decide + learn), off-policy
// evaluation, an end-to-end learning simulation, and a single unified feedback
// call. Every endpoint is keyed by a free-form `useCase` string (e.g.
// "lead_score", "claim_triage", "churn") so a single tenant can run many
// independent models. All calls are tenant-scoped server-side by the caller's
// API key — no tenant argument is needed.
//
// Endpoints live under /api/v1/builtin-agents/ml/{use_case}/...

/** One labeled training example for supervised scoring. */
export interface ScoringTrainRow {
	/**
	 * The example's feature map. Keys and value types are use-case-defined;
	 * the platform infers the schema across the batch.
	 */
	features: Record<string, unknown>;
	/** The binary target (0 or 1). */
	label: number;
}

/** Request body for training a scoring model. */
export interface TrainScoringParams {
	/** The labeled training examples. Required. */
	rows: ScoringTrainRow[];
	/**
	 * Optionally caps the hyperparameter-search trial budget. Omit for the
	 * platform default.
	 */
	optimize_budget?: number;
}

/** A single feature's contribution to the trained model, by total gain. */
export interface FeatureImportance {
	name: string;
	gain: number;
}

/**
 * The trained model's held-out metrics, the chosen hyperparameters, and the
 * new model version. `brier` is post-calibration; `brier_uncalibrated` and
 * `brier_baseline` contextualize the calibration lift.
 */
export interface TrainScoringResult {
	auc: number;
	logloss: number;
	brier: number;
	brier_uncalibrated: number;
	brier_baseline: number;
	ece: number;
	n: number;
	importances: FeatureImportance[];
	best_params: Record<string, unknown>;
	calibration_method: string;
	trials: number;
	model_version: number;
}

/** Request body for scoring a single example. */
export interface PredictScoreParams {
	/** The example's feature map. Required. */
	features: Record<string, unknown>;
}

/**
 * The calibrated prediction for one example. `score` is the calibrated
 * probability; `raw` is the model's pre-calibration output. `served_from`
 * reports which model tier answered (e.g. cache vs. live).
 */
export interface PredictScoreResult {
	score: number;
	raw: number;
	model_version: number;
	served_from: string;
	calibration_method: string;
}

/** One candidate action for a next-best-action decision. */
export interface NBAAction {
	/** Identifies the action. Required. */
	id: string;
	/**
	 * The action's feature map (combined with the request context to score
	 * the action).
	 */
	features: Record<string, unknown>;
}

/** Request body for a next-best-action decision. */
export interface DecideNBAParams {
	/**
	 * The decision context shared across all candidate actions. Required.
	 */
	context: Record<string, unknown>;
	/** The candidate actions to choose among. Required. */
	actions: NBAAction[];
	/**
	 * Optionally forces exploration on (true) or off (false). Omit to let the
	 * policy decide.
	 */
	explore?: boolean;
}

/** The scored result for one candidate action. */
export interface NBAActionScore {
	action_id: string;
	score: number;
	propensity: number;
}

/**
 * The policy's chosen action plus the full scored slate. `propensity` is the
 * probability the policy assigned to the chosen action — record it and pass it
 * back to {@link Ml.learnNba} for unbiased learning. `explore` reports whether
 * the choice was an exploration step.
 */
export interface DecideNBAResult {
	action_id: string;
	propensity: number;
	scores: NBAActionScore[];
	explore: boolean;
	model_n: number;
}

/** Request body for recording the realized reward of a next-best-action decision. */
export interface LearnNBAParams {
	/** The decision context that was used. */
	context?: Record<string, unknown>;
	/** The action that was taken. Required. */
	action_id: string;
	/** The taken action's feature map. */
	action_features?: Record<string, unknown>;
	/**
	 * The probability the policy assigned to the taken action at decision time
	 * (from {@link DecideNBAResult.propensity}). Pass it for unbiased off-policy
	 * learning; omit if unknown.
	 */
	propensity?: number;
	/** The realized reward for the taken action. Required. */
	reward: number;
}

/**
 * Acknowledges a recorded reward. `n` is the running count of learning
 * examples the policy has ingested.
 */
export interface LearnNBAResult {
	ok: boolean;
	n: number;
}

/**
 * One logged decision used for off-policy evaluation: the context, the action
 * taken, the logging policy's propensity for that action, and the realized
 * reward.
 */
export interface OPELoggedRecord {
	context: Record<string, unknown>;
	action_id: string;
	propensity: number;
	reward: number;
}

/** Request body for off-policy evaluation. */
export interface EvaluateOPEParams {
	/**
	 * The logged decisions to evaluate the current policy against. Required.
	 */
	logged: OPELoggedRecord[];
}

/**
 * Off-policy value estimates for the current policy against the logged data:
 * inverse-propensity (IPS), self-normalized IPS (SNIPS), and doubly-robust
 * (DR), with a confidence interval and the effective sample size (ESS).
 * `estimator_ci` names which estimator the CI bounds describe.
 */
export interface EvaluateOPEResult {
	ips: number;
	snips: number;
	dr: number;
	ci_low: number;
	ci_high: number;
	n: number;
	ess: number;
	estimator_ci: string;
}

/**
 * Request body for a single-call learning simulation. The platform runs the
 * entire closed loop in-process — many rounds of (accrue outcomes → train the
 * auto-tuned scoring model → bandit decide/reward/learn → off-policy
 * evaluation) — so an integrator can trigger and observe the whole
 * self-learning pipeline with one call. It runs on a built-in synthetic
 * scenario scoped to `useCase`, so it never touches production models or the
 * cross-tenant global prior.
 */
export interface SimulateRoundsParams {
	/**
	 * Selects the built-in synthetic world to learn (e.g. "real_estate"). Omit
	 * for the platform default.
	 */
	scenario?: string;
	/**
	 * How many learning rounds to run (the platform clamps to a sane range).
	 * Omit for the platform default.
	 */
	rounds?: number;
	/**
	 * Optionally makes the run reproducible (same seed → same curve). Omit for
	 * a fresh cold-start each call.
	 */
	seed?: number;
}

/**
 * One round of the learning curve. `auc` is the scoring model's held-out
 * accuracy that round; `nba_value` is the bandit policy's off-policy value;
 * `ope_dr`/`ci_low`/`ci_high` report the doubly-robust estimate and its
 * confidence interval on that round's logged decisions.
 */
export interface SimulateRoundPoint {
	round: number;
	n: number;
	auc: number;
	nba_value: number;
	nba_reward: number;
	ope_dr: number;
	ci_low: number;
	ci_high: number;
}

/**
 * The final scoring model after the last round — the same shape
 * {@link TrainScoringResult} returns, summarized for display.
 */
export interface SimulateModelSummary {
	auc: number;
	brier: number;
	ece: number;
	n: number;
	calibration_method: string;
	best_params: Record<string, unknown>;
	importances: FeatureImportance[];
}

/** One action's learned value within a segment's policy, with a label. */
export interface SimulatePolicyActionScore {
	action_id: string;
	score: number;
	label: string;
}

/**
 * The learned next-best-action policy for one segment: the recommended action
 * plus every action's learned value.
 */
export interface SimulatePolicyEntry {
	segment: string;
	recommended_action: string;
	recommended_label: string;
	scores: SimulatePolicyActionScore[];
}

/** The off-policy value estimate of the final learned policy. */
export interface SimulateOPESummary {
	dr: number;
	ci_low: number;
	ci_high: number;
}

/**
 * The outcome of a learning simulation: the per-round learning curve plus the
 * final trained model, the learned policy per segment, and the off-policy
 * value estimate of the final policy.
 */
export interface SimulateRoundsResult {
	scenario: string;
	action_labels: Record<string, string>;
	series: SimulateRoundPoint[];
	model: SimulateModelSummary | null;
	policy: SimulatePolicyEntry[];
	ope: SimulateOPESummary;
}

/**
 * Request body for the unified feedback call — the single operator-facing way
 * to teach the platform from a realized outcome. It persists the labeled
 * outcome for scoring (which retrains on the platform schedule) and, when
 * `action_id` is set, immediately teaches the bandit the realized reward. Only
 * `converted` is required; everything else is optional.
 */
export interface RecordFeedbackParams {
	/**
	 * Optionally identifies the subject of the outcome (e.g. the lead/user the
	 * prediction was about), for joining back to the prediction.
	 */
	subject_id?: string;
	/**
	 * The subject's feature map at decision time. Provide it to persist a
	 * fully-labeled scoring example; omit to record the outcome against a
	 * previously logged prediction.
	 */
	features?: Record<string, unknown>;
	/** The realized binary outcome (true = positive). Required. */
	converted: boolean;
	/**
	 * Optionally records the score the model predicted, for calibration
	 * tracking. Omit if unknown.
	 */
	predicted_score?: number;
	/** An optional free-form annotation for the outcome. */
	note?: string;
	/**
	 * Optionally identifies the action that was taken. When set, the bandit is
	 * taught the realized reward immediately.
	 */
	action_id?: string;
	/**
	 * The bandit decision context that was used. Provide it with `action_id`
	 * for unbiased bandit learning.
	 */
	context?: Record<string, unknown>;
	/** The taken action's feature map. */
	action_features?: Record<string, unknown>;
	/**
	 * The probability the policy assigned to the taken action at decision time
	 * (from {@link DecideNBAResult.propensity}). Pass it for unbiased off-policy
	 * learning; omit if unknown.
	 */
	propensity?: number;
	/**
	 * The realized reward for the taken action. Omit to default to
	 * `converted ? 1 : 0`.
	 */
	reward?: number;
}

/**
 * Acknowledges a unified feedback call. `outcome_recorded` reports whether the
 * labeled scoring outcome was persisted; `bandit_updated` reports whether the
 * bandit was taught (only when `action_id` was given), with `bandit_n` as the
 * policy's running learning-example count and `bandit_error` carrying any
 * non-fatal bandit-update error. `message` is a human-readable summary.
 */
export interface RecordFeedbackResult {
	ok: boolean;
	use_case: string;
	converted: boolean;
	outcome_recorded: boolean;
	bandit_updated: boolean;
	bandit_n?: number;
	bandit_error?: string;
	message: string;
}

// ---------------------------------------------------------------------------
// Multimodal Knowledge Base — Plan 2/3 ingestion + retrieval surface.
//
// Mirrors the Go SDK's KnowledgeResource multimodal methods (knowledge_multimodal.go)
// and the platform's /knowledge/{facts,traverse,compare,entities,multimodal-schemas}
// endpoints. Facts carry full provenance (source doc/page/snippet, effective
// date, version) so agents can cite-and-verify.
// ---------------------------------------------------------------------------

/**
 * A single relationship instance with provenance. Returned by the `/facts`
 * endpoints and the 4 retrieval tools (kb_get_entity, kb_traverse, kb_compare).
 */
export interface KBFact {
	fact_id: string;
	from_node_id: string;
	to_node_id: string;
	relation_type: string;
	properties?: Record<string, unknown>;
	source_document_id: string;
	source_page: number;
	source_snippet: string;
	extraction_confidence: number;
	/** ISO 8601 date. */
	effective_date: string;
	version: number;
	is_active: boolean;
	created_at?: string;
}

/** Identifies an entity by its (type, key) tuple. */
export interface KBEntityRef {
	type: string;
	key: Record<string, unknown>;
}

/** Paginated `/facts` list response. */
export interface KBFactListResponse {
	facts: KBFact[];
	next_page_token?: string;
}

/** Version-chain response for a fact tuple. */
export interface KBFactHistoryResponse {
	versions: KBFact[];
}

/** kb_get_entity payload — an entity plus all active facts attached to it. */
export interface KBGetEntityResponse {
	entity_type: string;
	entity_key: Record<string, unknown>;
	entity_node_id: string;
	outgoing_facts: KBFact[];
	incoming_facts: KBFact[];
}

/** One fact returned by kb_traverse with its traversal depth. */
export interface KBTraverseTuple {
	depth: number;
	fact: KBFact;
}

/** kb_traverse payload. */
export interface KBTraverseResponse {
	facts: KBTraverseTuple[];
}

/** Options for {@link Knowledge.traverse}. */
export interface TraverseOptions {
	/** "outbound" | "inbound" | "both" (default outbound). */
	direction?: "outbound" | "inbound" | "both";
	/** 1..3 (default 1). */
	maxDepth?: number;
}

/** Options for {@link Knowledge.listFacts}. */
export interface ListFactsOptions {
	limit?: number;
	pageToken?: string;
}

/** Body of POST /knowledge/compare. */
export interface CompareRequest {
	entities: KBEntityRef[];
	via_relation: string;
	target_entity: KBEntityRef;
	property_path: string;
}

/** One row in a kb_compare response. */
export interface KBCompareRow {
	entity: KBEntityRef;
	value?: unknown;
	fact?: KBFact;
	missing: boolean;
	missing_reason?: string;
}

/** kb_compare payload. */
export interface KBCompareResponse {
	rows: KBCompareRow[];
}

/** Body of PATCH /knowledge/documents/{id}/classification. */
export interface PatchClassificationRequest {
	root_entity: KBEntityRef;
}

/** Result of resolving a needs_classification document. */
export interface PatchClassificationResponse {
	status: string;
	document_id: string;
}

/** Result of POST /knowledge/documents/{id}/reingest. */
export interface ReingestResponse {
	status: string;
	document_id: string;
	mode: string;
}

/** One line item in a per-document cost breakdown. */
export interface KBDocCostBreakdown {
	operation: string;
	model: string;
	cost_usd: number;
	pages?: number;
}

/** Per-document billed cost breakdown (GET /knowledge/documents/{id}/cost). */
export interface KBDocCostResponse {
	document_id: string;
	total_cost_usd: number;
	document_ai_rows: KBDocCostBreakdown[];
	llm_rows: KBDocCostBreakdown[];
}

/** A single typed property on a multimodal entity or relation type. */
export interface KBSchemaProperty {
	name: string;
	type: string;
	required: boolean;
	description?: string;
}

/** A document type in a multimodal schema. */
export interface KBDocType {
	type: string;
	root_entity_type: string;
	expected_relationships?: string[];
}

/** An entity type in a multimodal schema. */
export interface KBEntityType {
	type: string;
	key_fields: string[];
	is_root_candidate: boolean;
	aliases_field?: string;
	properties?: KBSchemaProperty[];
}

/** A relationship type in a multimodal schema. */
export interface KBRelationType {
	type: string;
	from: string;
	to: string;
	supersession_identity: string[];
	properties?: KBSchemaProperty[];
}

/** Model + threshold configuration for a multimodal schema version. */
export interface KBSchemaConfig {
	schema_propose_model?: string;
	classify_model?: string;
	extract_model?: string;
	ingestion_verifier_model?: string;
	classify_auto_threshold?: number;
	extract_min_provenance_confidence?: number;
	abstain_below_confidence?: number;
	use_document_ai_preprocessor?: boolean;
}

/** A multimodal KB schema version for a project. */
export interface KBMultimodalSchema {
	project_id: string;
	schema_version: number;
	status: string;
	created_at: string;
	created_by?: string;
	vertical_template?: string;
	template_lineage?: string;
	config: KBSchemaConfig;
	doc_types: KBDocType[];
	entity_types: KBEntityType[];
	relationship_types: KBRelationType[];
}

/** Body of POST /knowledge/multimodal-schemas — a new schema version. */
export type CreateMultimodalSchemaOptions = KBMultimodalSchema;

/** List of multimodal schema versions. */
export interface KBMultimodalSchemaListResponse {
	schemas: KBMultimodalSchema[];
}

/** Result of creating a multimodal schema version. */
export interface KBMultimodalSchemaCreateResponse {
	schema: KBMultimodalSchema;
}

/** Result of activating a draft multimodal schema version. */
export interface KBMultimodalSchemaActivateResponse {
	active_version: number;
	status: string;
}

/** Options for {@link Agents.updatePersonality}. */
export interface UpdatePersonalityOptions {
	big5?: Big5Scores;
	dimensions?: SDKPersonalityDimensions;
}

/** Result of PATCH /agents/{agentId}/personality. */
export interface UpdatePersonalityResponse {
	success: boolean;
}

// ---------------------------------------------------------------------------
// Lead Assignments (client.leadAssignments) — Wave-3 rep-copilot follow-up
// ---------------------------------------------------------------------------
//
// The tenant-generic work-distribution primitive (any vertical — leads,
// tickets, shifts): offer a unit of work to one rep from a candidate roster,
// structurally dedup (one active assignment per lead_ref), and re-offer on
// SLA expiry. Endpoints live under /api/v1/lead-assignments*.

/** One row of the assignment ledger. */
export interface LeadAssignment {
	assignment_id: string;
	/** Caller-owned external key for the unit of work (CRM lead id, ticket id, shift id, ...). */
	lead_ref: string;
	rep_user_id: string;
	/** offered | claimed | expired | reassigned | released | completed. */
	state: string;
	/** The distribution policy that chose rep_user_id (round_robin, load_balanced). */
	policy: string;
	propensity?: number;
	features?: Record<string, unknown>;
	offered_at: string;
	sla_expires_at: string;
	claimed_at?: string;
	completed_at?: string;
	/** Links a re-offered assignment back to the expired one it replaced. */
	prior_assignment_id?: string;
}

/** Request body for offering a unit of work to a rep. */
export interface OfferLeadAssignmentParams {
	/** Caller-owned external key for the unit of work. Required. */
	lead_ref: string;
	/** Eligible rep user ids to distribute among. Required, at least one. */
	candidates: string[];
	/** Distribution policy: round_robin (default) or load_balanced. */
	policy?: string;
	/** Optional context/ML signals captured at offer time. */
	features?: Record<string, unknown>;
	/** Offer window in seconds before re-offer to the next candidate (platform default 900). */
	sla_seconds?: number;
}

/**
 * Outcome of an offer call. `deduplicated` is true when the lead already had
 * an active assignment; `assignment` is then the pre-existing one.
 */
export interface OfferLeadAssignmentResult {
	assignment: LeadAssignment;
	deduplicated: boolean;
}

/** Filters for listing lead assignments. */
export interface ListLeadAssignmentsOptions {
	/** Only assignments offered to this rep. */
	repUserId?: string;
	/** Only assignments in this state (offered, claimed, expired, reassigned, released, completed). */
	state?: string;
	/** Max rows (platform default 50, max 200). */
	limit?: number;
}

/** A page of the project's assignment ledger, newest offer first. */
export interface ListLeadAssignmentsResult {
	assignments: LeadAssignment[];
}

// ---------------------------------------------------------------------------
// Adapter ingestion (client.ingest) — Wave-3 rep-copilot follow-up
// ---------------------------------------------------------------------------
//
// A customer-owned adapter (e.g. a CRM sidecar under app-runtime) normalizes
// its own events/contacts and POSTs them here, so the platform's pipelines,
// lead-assignment ledger, and outbound webhooks can react — without the
// platform ever holding CRM tables. Endpoints live under /api/v1/ingest/*.

/** DomainEvent v1 closed event-type enum (POST /ingest/events' `type` field). */
export const INGEST_EVENT_TYPES = {
	LEAD_CREATED: "lead.created",
	LEAD_UPDATED: "lead.updated",
	LEAD_STAGE_CHANGED: "lead.stage_changed",
	INVENTORY_UPDATED: "inventory.updated",
	PRICE_CHANGED: "price.changed",
	MESSAGE_RECEIVED: "message.received",
	OUTCOME_RECORDED: "outcome.recorded",
} as const;

export type IngestEventType =
	(typeof INGEST_EVENT_TYPES)[keyof typeof INGEST_EVENT_TYPES];

/** Request body for storing one normalized DomainEvent v1. */
export interface IngestEventParams {
	/** Adapter-chosen idempotency key (UUID); replaying the same event_id into the same project is a no-op. Required. */
	event_id: string;
	/** One of the closed DomainEvent v1 types. Required. */
	type: IngestEventType | string;
	/** When the event happened in the source system (RFC 3339). Required. */
	occurred_at: string;
	/** Stable external lead identifier (CRM record id, ...). */
	lead_ref?: string;
	/** Stable external contact identifier (see Ingest.upsertContact). */
	contact_ref?: string;
	/** Type-specific event body, stored verbatim and fanned out to subscribers. */
	payload?: Record<string, unknown>;
}

/**
 * Outcome of storing one domain event. `duplicate` is true when this
 * event_id was already stored for the project — the replay was a no-op and
 * no fan-out happened.
 */
export interface IngestEventResult {
	event_id: string;
	type: string;
	duplicate: boolean;
}

/** Request body for upserting a contact/rep registry entry. */
export interface IngestContactParams {
	/** Stable external identifier the adapter owns; upsert key within the project. Required. */
	contact_ref: string;
	/** "rep" (the tenant's own salesperson) or "lead_contact" (an end customer). Required. */
	kind: "rep" | "lead_contact";
	display_name?: string;
	/** E.164 phone number, e.g. +639171234567. */
	phone_e164?: string;
	email?: string;
	/** CRM-side owner/user id (e.g. Salesforce OwnerId) for write-back routing. */
	crm_owner_id?: string;
	/** Free-form registry metadata (channel identities, desk, brand assignments, ...). */
	metadata?: Record<string, unknown>;
}

/** A stored contact/rep registry entry. */
export interface IngestContact {
	id: string;
	contact_ref: string;
	kind: string;
	display_name?: string;
	phone_e164?: string;
	email?: string;
	crm_owner_id?: string;
	metadata?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

/**
 * One row of the listEvents read path — the envelope minus the payload body
 * (a completeness/gap check needs the keys, not the verbatim body).
 */
export interface IngestedEvent {
	event_id: string;
	type: string;
	occurred_at: string;
	lead_ref?: string;
	contact_ref?: string;
	created_at: string;
}

/** Options for listing stored domain events. */
export interface ListIngestEventsOptions {
	/** RFC 3339 lower bound: return events stored at/after this time. Required. */
	since: string;
	/** Max events per page (platform default 200, max 1000). */
	limit?: number;
	/** Opaque pagination cursor from a prior page's next_cursor (overrides since when set). */
	cursor?: string;
}

/**
 * A page of stored domain events. `next_cursor` is set only when a full page
 * was returned; feed it back as `cursor` to fetch the next page.
 */
export interface ListIngestEventsResult {
	events: IngestedEvent[];
	next_cursor?: string;
}

// ---------------------------------------------------------------------------
// Runtime CRM (client.crm)
// ---------------------------------------------------------------------------

export interface CrmContact {
	id: string;
	tenant_id?: string;
	project_id?: string;
	first_name?: string;
	last_name?: string;
	emails: unknown;
	phones: unknown;
	lead_ref?: string;
	owner_user_id?: string;
	source?: string;
	external_ref?: string;
	custom: unknown;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmCompany {
	id: string;
	tenant_id?: string;
	project_id?: string;
	name: string;
	domain?: string;
	custom: unknown;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmPipeline {
	id: string;
	tenant_id?: string;
	project_id?: string;
	name: string;
	is_default: boolean;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmStage {
	id: string;
	pipeline_id: string;
	tenant_id?: string;
	name: string;
	kind: string;
	sort_order: number;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmDeal {
	id: string;
	tenant_id?: string;
	project_id?: string;
	contact_id?: string;
	company_id?: string;
	pipeline_id: string;
	stage_id: string;
	catalog_item_id?: string;
	value_cents?: number;
	currency?: string;
	owner_user_id?: string;
	lead_ref?: string;
	custom: unknown;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmDealStageHistory {
	id: string;
	deal_id: string;
	tenant_id?: string;
	from_stage_id?: string;
	to_stage_id: string;
	moved_by_user_id?: string;
	moved_at: string;
}

export interface CrmActivity {
	id: string;
	tenant_id?: string;
	project_id?: string;
	kind: string;
	contact_id?: string;
	deal_id?: string;
	body?: string;
	payload?: unknown;
	due_at?: string;
	done_at?: string;
	author_user_id?: string;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmCustomField {
	id: string;
	tenant_id?: string;
	object_type: string;
	field_key: string;
	label: string;
	field_type: string;
	options?: unknown;
	required: boolean;
	archived: boolean;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
}

export interface CrmEvent {
	cursor: string;
	tenant_id?: string;
	event: string;
	entity_id?: string;
	entity_type?: string;
	payload: unknown;
	at: string;
}

export interface CrmBoardStage extends CrmStage {
	deals: CrmDeal[];
}

export interface CrmBoard {
	pipeline: CrmPipeline;
	stages: CrmBoardStage[];
}

export interface CrmImportItem {
	project_id?: string;
	external_ref: string;
	first_name?: string;
	last_name?: string;
	emails?: unknown;
	phones?: unknown;
	lead_ref?: string;
	owner_user_id?: string;
	source?: string;
	custom?: unknown;
}

export interface CrmImportContactsOptions {
	contacts: CrmImportItem[];
}

export interface CrmImportResult {
	imported: number;
	contacts: CrmContact[];
}

export interface CrmEventsOptions {
	cursor?: string;
	limit?: number;
}

export interface CrmEventsPage {
	events: CrmEvent[];
	next_cursor?: string;
}

// ---------------------------------------------------------------------------
// Conversation push (client.conversations.push) — Wave-3 rep-copilot follow-up
// ---------------------------------------------------------------------------

/** Options for pushing a proactive agent message to a user's channel. */
export interface ConversationPushOptions {
	/** Agent UUID or name authoring the message. Required. */
	agentId: string;
	/** Platform user id to deliver to (channel identity owner). Required. */
	userId: string;
	/** Message text. Required. */
	content: string;
	/** Project UUID; defaults to the authenticated project/default project. */
	projectId?: string;
	/** Restrict delivery to one channel (whatsapp, messenger, instagram); defaults to the first identity found. */
	channelType?: "whatsapp" | "messenger" | "instagram";
	/** Pin the outbound channel connection UUID. */
	connectionId?: string;
}

/** Outcome of a proactive channel push. */
export interface ConversationPushResult {
	/** Durable conversation the message was recorded under. */
	conversation_id?: string;
	/** Channel the message was delivered on. */
	channel_type: string;
	/** Channel-native recipient id (e.g. WhatsApp phone). */
	external_id: string;
	/** Provider message id. */
	channel_message_id?: string;
	/** Provider delivery status (sent | delivered | read | failed). */
	delivery_status: string;
	/** Conversation session the outbound turn was recorded under. */
	session_id?: string;
	/** True when the 24h window was closed and the send used the connection's approved re-engagement template. */
	used_template: boolean;
}

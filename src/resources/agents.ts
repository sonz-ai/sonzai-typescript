import type { HTTPClient } from "../http.js";

function requireNonEmpty(value: string, name: string): void {
	if (!value || typeof value !== "string" || value.trim() === "") {
		throw new Error(`${name} must be a non-empty string`);
	}
}

import { DEFAULT_DETACHED_TIMEOUT_MS, type DetachOptions } from "../types.js";
import type {
	Agent,
	AgentCapabilities,
	AgentKBSearchOptions,
	AgentKBSearchResponse,
	AgentListOptions,
	AgentListResponse,
	BreakthroughsResponse,
	ChatAsyncResponse,
	ChatAsyncResult,
	ChatOptions,
	ChatResponse,
	ChatStreamEvent,
	ChatUsage,
	ConsolidateOptions,
	ConsolidateResponse,
	ConstellationNode,
	ConstellationResponse,
	ContextDataOptions,
	CreateAgentOptions,
	CreateConstellationNodeOptions,
	CreateCustomToolOptions,
	CreateGoalOptions,
	CreateHabitOptions,
	CustomToolDefinition,
	CustomToolListResponse,
	DeleteGoalOptions,
	DeleteHabitOptions,
	DeleteWisdomResponse,
	DialogueOptions,
	DialogueResponse,
	DiaryResponse,
	EnrichedContextResponse,
	EvalOnlyOptions,
	EvaluateOptions,
	EvaluationResult,
	ForkAgentOptions,
	ForkResponse,
	ForkStatusResponse,
	GenerateAvatarOptions,
	GenerateAvatarResponse,
	GetContextOptions,
	GetToolSchemasResponse,
	Goal,
	GoalsResponse,
	Habit,
	HabitsResponse,
	InterestsResponse,
	ModelsResponse,
	MoodAggregateResponse,
	MoodHistoryResponse,
	MoodResponse,
	ProcessOptions,
	ProcessResponse,
	RelationshipResponse,
	RunEvalOptions,
	RunRef,
	ScheduleWakeupOptions,
	ScheduledWakeup,
	SetStatusOptions,
	SetStatusResponse,
	SimulateOptions,
	SimulationEvent,
	SummariesOptions,
	SummariesResponse,
	TimeMachineOptions,
	TimeMachineResponse,
	ToolSchemasResponse,
	TriggerEventOptions,
	TriggerEventResponse,
	UpdateAgentOptions,
	UpdateCapabilitiesOptions,
	UpdateConstellationNodeOptions,
	UpdateCustomToolOptions,
	UpdateGoalOptions,
	UpdateHabitOptions,
	UpdatePersonalityOptions,
	UpdatePersonalityResponse,
	UpdateProjectOptions,
	UpdateProjectResponse,
	UsersResponse,
	WakeupsResponse,
	WisdomAuditResponse,
} from "../types.js";
import { CustomStates } from "./custom-states.js";
import { Generation } from "./generation.js";
import { Instances } from "./instances.js";
import { Inventory } from "./inventory.js";
import { Memory } from "./memory.js";
import { Notifications } from "./notifications.js";
import { Personality } from "./personality.js";
import { Priming } from "./priming.js";
import { Schedules } from "./schedules.js";
import { Sessions } from "./sessions.js";
import { Voice } from "./voice.js";

export class Agents {
	readonly memory: Memory;
	readonly personality: Personality;
	readonly sessions: Sessions;
	readonly instances: Instances;
	readonly notifications: Notifications;
	readonly customStates: CustomStates;
	readonly voice: Voice;
	readonly generation: Generation;
	readonly priming: Priming;
	readonly inventory: Inventory;
	readonly schedules: Schedules;

	constructor(private readonly http: HTTPClient) {
		this.memory = new Memory(http);
		this.personality = new Personality(http);
		this.sessions = new Sessions(http);
		this.instances = new Instances(http);
		this.notifications = new Notifications(http);
		this.customStates = new CustomStates(http);
		this.voice = new Voice(http);
		this.generation = new Generation(http);
		this.priming = new Priming(http);
		this.inventory = new Inventory(http);
		this.schedules = new Schedules(http);
	}

	// -- Agent CRUD --

	/** Create a new agent. */
	async create(options: CreateAgentOptions): Promise<Agent> {
		const body: Record<string, unknown> = { name: options.name };
		if (options.agentId) body.agent_id = options.agentId;
		if (options.userId) body.user_id = options.userId;
		if (options.userDisplayName)
			body.user_display_name = options.userDisplayName;
		if (options.gender) body.gender = options.gender;
		if (options.bio) body.bio = options.bio;
		if (options.avatarUrl) body.avatar_url = options.avatarUrl;
		if (options.projectId) body.project_id = options.projectId;
		if (options.personalityPrompt)
			body.personality_prompt = options.personalityPrompt;
		if (options.speechPatterns) body.speech_patterns = options.speechPatterns;
		if (options.trueInterests) body.true_interests = options.trueInterests;
		if (options.trueDislikes) body.true_dislikes = options.trueDislikes;
		if (options.primaryTraits) body.primary_traits = options.primaryTraits;
		if (options.big5) body.big5 = options.big5;
		if (options.dimensions) body.dimensions = options.dimensions;
		if (options.preferences) body.preferences = options.preferences;
		if (options.behaviors) body.behaviors = options.behaviors;
		if (options.capabilities) body.capabilities = options.capabilities;
		if (options.toolCapabilities)
			body.tool_capabilities = options.toolCapabilities;
		if (options.generateAvatar != null)
			body.generate_avatar = options.generateAvatar;
		if (options.language) body.language = options.language;
		if (options.seedMemories) body.seed_memories = options.seedMemories;
		if (options.loreContext) body.lore_generation_context = options.loreContext;
		if (options.generateOriginStory != null)
			body.generate_origin_story = options.generateOriginStory;
		if (options.generatePersonalizedMemories != null)
			body.generate_personalized_memories =
				options.generatePersonalizedMemories;
		if (options.initialGoals) {
			body.initial_goals = options.initialGoals.map((g) => ({
				type: g.type,
				title: g.title,
				description: g.description,
				priority: g.priority,
				related_traits: g.relatedTraits,
			}));
		}
		if (options.proactiveMode) body.proactiveMode = options.proactiveMode;

		return this.http.post<Agent>("/api/v1/agents", body);
	}

	/** Get an agent by ID. */
	async get(agentId: string): Promise<Agent> {
		requireNonEmpty(agentId, "agentId");
		return this.http.get<Agent>(`/api/v1/agents/${agentId}`);
	}

	/** Update an agent's profile. */
	async update(agentId: string, options: UpdateAgentOptions): Promise<Agent> {
		requireNonEmpty(agentId, "agentId");
		const body: Record<string, unknown> = {};
		if (options.name) body.name = options.name;
		if (options.bio) body.bio = options.bio;
		if (options.avatarUrl) body.avatar_url = options.avatarUrl;
		if (options.personalityPrompt)
			body.personality_prompt = options.personalityPrompt;
		if (options.speechPatterns) body.speech_patterns = options.speechPatterns;
		if (options.trueInterests) body.true_interests = options.trueInterests;
		if (options.trueDislikes) body.true_dislikes = options.trueDislikes;
		if (options.big5) body.big5 = options.big5;
		if (options.dimensions) body.dimensions = options.dimensions;
		if (options.toolCapabilities)
			body.tool_capabilities = options.toolCapabilities;

		return this.http.patch<Agent>(`/api/v1/agents/${agentId}/profile`, body);
	}

	/** Delete an agent. */
	async delete(agentId: string): Promise<void> {
		requireNonEmpty(agentId, "agentId");
		await this.http.delete(`/api/v1/agents/${agentId}`);
	}

	// -- Chat --

	/** Send a chat message (non-streaming). Consumes the SSE stream and returns aggregated content. */
	async chat(options: ChatOptions): Promise<ChatResponse> {
		const body = this.buildChatBody(options);
		const parts: string[] = [];
		let usage: ChatUsage | undefined;

		for await (const event of this.http.streamSSE(
			"POST",
			`/api/v1/agents/${options.agent}/chat`,
			body,
		)) {
			const parsed = event as ChatStreamEvent;
			const content = parsed.choices?.[0]?.delta?.content;
			if (content) parts.push(content);
			if (parsed.usage) usage = parsed.usage;
		}

		return { content: parts.join(""), sessionId: "", usage };
	}

	/** Send a chat message and stream events as an async iterator. */
	async *chatStream(options: ChatOptions): AsyncGenerator<ChatStreamEvent> {
		requireNonEmpty(options.agent, "agentId");
		const body = this.buildChatBody(options);
		for await (const event of this.http.streamSSE(
			"POST",
			`/api/v1/agents/${options.agent}/chat`,
			body,
		)) {
			yield event as ChatStreamEvent;
		}
	}

	// -- Chat (detached — decouples from caller's AbortSignal) --

	/**
	 * Behaves like {@link chat} but detaches the underlying fetch from the
	 * caller's {@link AbortSignal}. Use this when invoking the SDK from a
	 * queue worker, Express/Hono request handler, or any context where
	 * the caller's `req.signal` (or equivalent) may fire before the AI
	 * generation completes — passing that signal to a vanilla
	 * {@link chat} would abort fetch mid-generation and waste tokens.
	 *
	 * Honours an SDK-managed timeout (default 5 minutes; override via
	 * `opts.timeoutMs`) so it cannot leak indefinitely. The optional
	 * `opts.parentSignal` is watched but NOT propagated — if it fires
	 * while the detached call is still running, the SDK invokes
	 * `opts.onParentCancel` (or logs a warning) so the misuse is visible
	 * during dev.
	 *
	 * Canonical use case: orchestrator wakeup handler dispatched from a
	 * NATS message whose ack window is shorter than an LLM stream.
	 */
	async chatDetached(
		options: ChatOptions,
		opts: DetachOptions = {},
	): Promise<ChatResponse> {
		requireNonEmpty(options.agent, "agentId");
		const body = this.buildChatBody(options);
		const { signal, dispose } = createDetachedSignal(opts);
		try {
			const parts: string[] = [];
			let usage: ChatUsage | undefined;
			for await (const event of this.http.streamSSE(
				"POST",
				`/api/v1/agents/${options.agent}/chat`,
				body,
				{ signal },
			)) {
				const parsed = event as ChatStreamEvent;
				const content = parsed.choices?.[0]?.delta?.content;
				if (content) parts.push(content);
				if (parsed.usage) usage = parsed.usage;
			}
			return { content: parts.join(""), sessionId: "", usage };
		} finally {
			dispose();
		}
	}

	/**
	 * Callback-based detached streaming variant. The callback fires for
	 * every {@link ChatStreamEvent}. See {@link chatDetached} for when and
	 * why to use the detached variants.
	 */
	async chatStreamDetached(
		options: ChatOptions,
		callback: (event: ChatStreamEvent) => void | Promise<void>,
		opts: DetachOptions = {},
	): Promise<void> {
		requireNonEmpty(options.agent, "agentId");
		const body = this.buildChatBody(options);
		const { signal, dispose } = createDetachedSignal(opts);
		try {
			for await (const event of this.http.streamSSE(
				"POST",
				`/api/v1/agents/${options.agent}/chat`,
				body,
				{ signal },
			)) {
				await callback(event as ChatStreamEvent);
			}
		} finally {
			dispose();
		}
	}

	/**
	 * AsyncIterableIterator-based detached streaming variant — the
	 * TypeScript analogue of sonzai-go's
	 * `ChatStreamChannelDetached(parent, params, opts) -> chan`. The
	 * returned iterator yields {@link ChatStreamEvent} frames until the
	 * stream ends or the detached timeout fires; cancellation from the
	 * caller's `parentSignal` is observed (via the warning/callback)
	 * but NOT propagated to the underlying fetch.
	 *
	 * See {@link chatDetached} for the broader rationale.
	 */
	chatStreamChannelDetached(
		options: ChatOptions,
		opts: DetachOptions = {},
	): AsyncIterableIterator<ChatStreamEvent> {
		requireNonEmpty(options.agent, "agentId");
		const body = this.buildChatBody(options);
		const { signal, dispose } = createDetachedSignal(opts);

		const upstream = this.http.streamSSE(
			"POST",
			`/api/v1/agents/${options.agent}/chat`,
			body,
			{ signal },
		);

		let disposed = false;
		const disposeOnce = (): void => {
			if (disposed) return;
			disposed = true;
			dispose();
		};

		const iter: AsyncIterableIterator<ChatStreamEvent> = {
			[Symbol.asyncIterator]() {
				return iter;
			},
			async next(): Promise<IteratorResult<ChatStreamEvent>> {
				try {
					const result = await upstream.next();
					if (result.done) {
						disposeOnce();
						return { value: undefined, done: true };
					}
					return {
						value: result.value as ChatStreamEvent,
						done: false,
					};
				} catch (err) {
					disposeOnce();
					throw err;
				}
			},
			async return(): Promise<IteratorResult<ChatStreamEvent>> {
				try {
					await upstream.return?.(undefined);
				} finally {
					disposeOnce();
				}
				return { value: undefined, done: true };
			},
			async throw(err): Promise<IteratorResult<ChatStreamEvent>> {
				try {
					await upstream.throw?.(err);
				} finally {
					disposeOnce();
				}
				throw err;
			},
		};

		return iter;
	}

	// -- Chat (async / processing_id polling, iter-140u-2) --

	/**
	 * Queue a chat request for background processing. Returns
	 * `{processingId, status: "queued"}` immediately. Use this when
	 * the chat may run longer than your network can keep an SSE
	 * stream open (Cloudflare/LB ~100s).
	 *
	 * Poll the result via `pollChatResult(...)` or use
	 * `chatAsyncBlocking(...)` for a convenience helper that polls
	 * until terminal.
	 */
	async chatAsync(options: ChatOptions): Promise<ChatAsyncResponse> {
		requireNonEmpty(options.agent, "agentId");
		const body = this.buildChatBody(options);
		const raw = await this.http.post<{ processing_id: string; status: string }>(
			`/api/v1/agents/${options.agent}/chat/async`,
			body,
		);
		return { processingId: raw.processing_id, status: raw.status };
	}

	/**
	 * Fetch the current state of an async chat task. Recommended
	 * polling cadence: 1s with exponential backoff up to 5s. Stop
	 * when `status` is `complete` or `failed`.
	 */
	async pollChatResult(
		agentId: string,
		processingId: string,
	): Promise<ChatAsyncResult> {
		requireNonEmpty(agentId, "agentId");
		requireNonEmpty(processingId, "processingId");
		const raw = await this.http.get<{
			status: string;
			response?: string;
			phase?: string;
			tool?: string;
			side_effects?: unknown;
			error?: string;
			created_at: string;
			updated_at: string;
		}>(`/api/v1/agents/${agentId}/chat/result/${processingId}`);
		return {
			status: raw.status,
			response: raw.response,
			phase: raw.phase,
			tool: raw.tool,
			sideEffects: raw.side_effects,
			error: raw.error,
			createdAt: raw.created_at,
			updatedAt: raw.updated_at,
		};
	}

	/**
	 * Convenience: queue async chat and poll until terminal. Backoff
	 * starts at `pollIntervalMs` (default 1000), doubles each
	 * iteration up to `maxPollIntervalMs` (default 5000). Total wait
	 * bounded by `timeoutMs` (default 600_000 — matches the server's
	 * CE_AGENT_CHAT_DEADLINE_MS).
	 *
	 * Cancelling locally (AbortSignal not yet wired) does NOT cancel
	 * the server-side task — that's the async pattern's invariant.
	 * Callers can re-poll the same processingId later.
	 */
	async chatAsyncBlocking(
		options: ChatOptions,
		pollOptions: {
			pollIntervalMs?: number;
			maxPollIntervalMs?: number;
			timeoutMs?: number;
		} = {},
	): Promise<ChatAsyncResult> {
		const pollIntervalMs = pollOptions.pollIntervalMs ?? 1000;
		const maxPollIntervalMs = pollOptions.maxPollIntervalMs ?? 5000;
		const timeoutMs = pollOptions.timeoutMs ?? 600_000;

		const queued = await this.chatAsync(options);
		const deadline = Date.now() + timeoutMs;
		let delay = pollIntervalMs;
		while (Date.now() < deadline) {
			await new Promise((resolve) => setTimeout(resolve, delay));
			const result = await this.pollChatResult(
				options.agent,
				queued.processingId,
			);
			if (result.status === "complete" || result.status === "failed") {
				return result;
			}
			if (delay < maxPollIntervalMs) {
				delay = Math.min(delay * 2, maxPollIntervalMs);
			}
		}
		throw new Error(
			`chatAsyncBlocking exceeded timeout (${timeoutMs}ms); ` +
				`processingId=${queued.processingId} can still be polled directly.`,
		);
	}

	// -- Dialogue --

	/** Initiate a dialogue with an agent. */
	async dialogue(
		agentId: string,
		options: DialogueOptions,
	): Promise<DialogueResponse> {
		const body: Record<string, unknown> = {};
		if (options.userId) body.user_id = options.userId;
		if (options.messages) body.messages = options.messages;
		if (options.requestType) body.request_type = options.requestType;
		if (options.sceneGuidance) body.scene_guidance = options.sceneGuidance;
		if (options.toolConfig) body.tool_config = options.toolConfig;
		if (options.instanceId) body.instance_id = options.instanceId;

		return this.http.post<DialogueResponse>(
			`/api/v1/agents/${agentId}/dialogue`,
			body,
		);
	}

	// -- Events --

	/** Trigger a backend event / activity for an agent. */
	async triggerBackendEvent(
		agentId: string,
		options: TriggerEventOptions,
	): Promise<TriggerEventResponse> {
		const body: Record<string, unknown> = {
			user_id: options.userId,
			event_type: options.eventType,
		};
		if (options.eventDescription)
			body.event_description = options.eventDescription;
		if (options.metadata) body.metadata = options.metadata;
		if (options.language) body.language = options.language;
		if (options.instanceId) body.instance_id = options.instanceId;
		if (options.messages) body.messages = options.messages;

		return this.http.post<TriggerEventResponse>(
			`/api/v1/agents/${agentId}/events`,
			body,
		);
	}

	// -- Wakeups --

	/** Schedule a wakeup for an agent. */
	async scheduleWakeup(
		agentId: string,
		options: ScheduleWakeupOptions,
	): Promise<ScheduledWakeup> {
		if (options.delayHours == null) {
			throw new Error("delay_hours is required");
		}
		const body: Record<string, unknown> = {
			user_id: options.userId,
			check_type: options.checkType,
			intent: options.intent,
			delay_hours: options.delayHours,
		};
		if (options.scheduled_at != null) body.scheduled_at = options.scheduled_at;
		if (options.occasion != null) body.occasion = options.occasion;
		if (options.interest_topic != null)
			body.interest_topic = options.interest_topic;
		if (options.event_description != null)
			body.event_description = options.event_description;

		return this.http.post<ScheduledWakeup>(
			`/api/v1/agents/${agentId}/wakeups`,
			body,
		);
	}

	/** Get wakeups for an agent. */
	async getWakeups(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<WakeupsResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/wakeups`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	// -- Evaluation --

	/** Evaluate an agent against a template. */
	async evaluate(
		agentId: string,
		options: EvaluateOptions,
	): Promise<EvaluationResult> {
		const body: Record<string, unknown> = {
			messages: options.messages,
			template_id: options.templateId,
		};
		if (options.configOverride) body.config_override = options.configOverride;

		return this.http.post<EvaluationResult>(
			`/api/v1/agents/${agentId}/evaluate`,
			body,
		);
	}

	/** Run a simulation and stream events (two-step: POST to start, then stream SSE). */
	async *simulate(
		agentId: string,
		options: SimulateOptions = {},
	): AsyncGenerator<SimulationEvent> {
		const ref = await this.simulateAsync(agentId, options);
		for await (const event of this.http.streamSSE(
			"GET",
			`/api/v1/eval-runs/${ref.run_id}/events?from=0`,
		)) {
			yield event as SimulationEvent;
		}
	}

	/** Start a simulation without waiting for results. Returns a RunRef for later streaming. */
	async simulateAsync(
		agentId: string,
		options: SimulateOptions = {},
	): Promise<RunRef> {
		const body: Record<string, unknown> = {};
		if (options.sessions) body.sessions = options.sessions;
		if (options.userPersona) body.user_persona = options.userPersona;
		if (options.config) body.config = options.config;
		if (options.model) body.model = options.model;
		if (options.configOverride) body.config_override = options.configOverride;

		return this.http.post<RunRef>(`/api/v1/agents/${agentId}/simulate`, body);
	}

	/** Run simulation + evaluation combined (two-step: POST to start, then stream SSE). */
	async *runEval(
		agentId: string,
		options: RunEvalOptions,
	): AsyncGenerator<SimulationEvent> {
		const ref = await this.runEvalAsync(agentId, options);
		for await (const event of this.http.streamSSE(
			"GET",
			`/api/v1/eval-runs/${ref.run_id}/events?from=0`,
		)) {
			yield event as SimulationEvent;
		}
	}

	/** Start simulation + evaluation without waiting for results. Returns a RunRef for later streaming. */
	async runEvalAsync(
		agentId: string,
		options: RunEvalOptions,
	): Promise<RunRef> {
		const body: Record<string, unknown> = {
			template_id: options.templateId,
		};
		if (options.sessions) body.sessions = options.sessions;
		if (options.userPersona) body.user_persona = options.userPersona;
		if (options.simulationConfig)
			body.simulation_config = options.simulationConfig;
		if (options.model) body.model = options.model;
		if (options.configOverride) body.config_override = options.configOverride;
		if (options.adaptationTemplateId)
			body.adaptation_template_id = options.adaptationTemplateId;
		if (options.qualityOnly != null) body.quality_only = options.qualityOnly;

		return this.http.post<RunRef>(`/api/v1/agents/${agentId}/run-eval`, body);
	}

	/** Re-evaluate an existing run (two-step: POST to start, then stream SSE). */
	async *evalOnly(
		agentId: string,
		options: EvalOnlyOptions,
	): AsyncGenerator<SimulationEvent> {
		const ref = await this.evalOnlyAsync(agentId, options);
		for await (const event of this.http.streamSSE(
			"GET",
			`/api/v1/eval-runs/${ref.run_id}/events?from=0`,
		)) {
			yield event as SimulationEvent;
		}
	}

	/** Re-evaluate an existing run without waiting for results. Returns a RunRef for later streaming. */
	async evalOnlyAsync(
		agentId: string,
		options: EvalOnlyOptions,
	): Promise<RunRef> {
		const body: Record<string, unknown> = {
			template_id: options.templateId,
			source_run_id: options.sourceRunId,
		};
		if (options.adaptationTemplateId)
			body.adaptation_template_id = options.adaptationTemplateId;
		if (options.qualityOnly != null) body.quality_only = options.qualityOnly;

		return this.http.post<RunRef>(`/api/v1/agents/${agentId}/eval-only`, body);
	}

	// -- Context Engine convenience accessors --

	async getMood(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<MoodResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/mood`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	async getMoodHistory(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<MoodHistoryResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/mood-history`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	/** Get aggregated mood statistics for an agent. */
	async getMoodAggregate(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<MoodAggregateResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/mood/aggregate`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	async getRelationships(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<RelationshipResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/relationships`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	/** List habits for an agent. */
	async listHabits(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<HabitsResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/habits`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	/** @deprecated Use listHabits() instead. */
	async getHabits(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<HabitsResponse> {
		return this.listHabits(agentId, options);
	}

	/** Create a habit for an agent. Set userId for a per-user habit. */
	async createHabit(
		agentId: string,
		options: CreateHabitOptions,
	): Promise<Habit> {
		const body: Record<string, unknown> = {
			name: options.name,
		};
		if (options.userId) body.user_id = options.userId;
		if (options.category) body.category = options.category;
		if (options.description) body.description = options.description;
		if (options.displayName) body.display_name = options.displayName;
		if (options.strength != null) body.strength = options.strength;

		return this.http.post<Habit>(`/api/v1/agents/${agentId}/habits`, body);
	}

	/** Update an existing habit by name. */
	async updateHabit(
		agentId: string,
		habitName: string,
		options: UpdateHabitOptions,
	): Promise<Habit> {
		const body: Record<string, unknown> = {};
		if (options.userId) body.user_id = options.userId;
		if (options.category) body.category = options.category;
		if (options.description) body.description = options.description;
		if (options.displayName) body.display_name = options.displayName;
		if (options.strength != null) body.strength = options.strength;

		return this.http.put<Habit>(
			`/api/v1/agents/${agentId}/habits/${encodeURIComponent(habitName)}`,
			body,
		);
	}

	/** Delete a habit. Set userId for per-user habits. */
	async deleteHabit(
		agentId: string,
		habitName: string,
		options: DeleteHabitOptions = {},
	): Promise<void> {
		const params: Record<string, string> = {};
		if (options.userId) params.user_id = options.userId;

		await this.http.delete(
			`/api/v1/agents/${agentId}/habits/${encodeURIComponent(habitName)}`,
			params,
		);
	}

	/** List goals for an agent. */
	async listGoals(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<GoalsResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/goals`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	/** @deprecated Use listGoals() instead. */
	async getGoals(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<GoalsResponse> {
		return this.listGoals(agentId, options);
	}

	/** Create a goal for an agent. Set userId to create a per-user goal. */
	async createGoal(agentId: string, options: CreateGoalOptions): Promise<Goal> {
		const body: Record<string, unknown> = {
			title: options.title,
			description: options.description,
		};
		if (options.userId) body.user_id = options.userId;
		if (options.type) body.type = options.type;
		if (options.priority != null) body.priority = options.priority;
		if (options.relatedTraits) body.related_traits = options.relatedTraits;

		return this.http.post<Goal>(`/api/v1/agents/${agentId}/goals`, body);
	}

	/** Update an existing goal. Set userId for per-user goals. */
	async updateGoal(
		agentId: string,
		goalId: string,
		options: UpdateGoalOptions,
	): Promise<Goal> {
		const body: Record<string, unknown> = {};
		if (options.userId) body.user_id = options.userId;
		if (options.title) body.title = options.title;
		if (options.description) body.description = options.description;
		if (options.priority != null) body.priority = options.priority;
		if (options.status) body.status = options.status;
		if (options.relatedTraits) body.related_traits = options.relatedTraits;

		return this.http.put<Goal>(
			`/api/v1/agents/${agentId}/goals/${goalId}`,
			body,
		);
	}

	/** Delete (soft-abandon) a goal. Set userId for per-user goals. */
	async deleteGoal(
		agentId: string,
		goalId: string,
		options: DeleteGoalOptions = {},
	): Promise<void> {
		const params: Record<string, string> = {};
		if (options.userId) params.user_id = options.userId;

		await this.http.delete(`/api/v1/agents/${agentId}/goals/${goalId}`, params);
	}

	async getInterests(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<InterestsResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/interests`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	async getDiary(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<DiaryResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/diary`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	async getUsers(
		agentId: string,
		options?: {
			limit?: number;
			offset?: number;
			sortBy?: string;
			sortOrder?: string;
		},
	): Promise<UsersResponse> {
		const params: Record<string, string | number | boolean | undefined> = {};
		if (options?.limit != null) params.limit = options.limit;
		if (options?.offset != null) params.offset = options.offset;
		if (options?.sortBy != null) params.sort_by = options.sortBy;
		if (options?.sortOrder != null) params.sort_order = options.sortOrder;
		return this.http.get(`/api/v1/agents/${agentId}/users`, params);
	}

	/** Get constellation data for an agent. */
	async getConstellation(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<ConstellationResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/constellation`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	/** Create a constellation node (lore) for an agent. */
	async createConstellationNode(
		agentId: string,
		options: CreateConstellationNodeOptions,
	): Promise<ConstellationNode> {
		const body: Record<string, unknown> = {
			label: options.label,
		};
		if (options.userId) body.user_id = options.userId;
		if (options.nodeType) body.node_type = options.nodeType;
		if (options.description) body.description = options.description;
		if (options.significance != null) body.significance = options.significance;

		return this.http.post<ConstellationNode>(
			`/api/v1/agents/${agentId}/constellation/nodes`,
			body,
		);
	}

	/** Update an existing constellation node. */
	async updateConstellationNode(
		agentId: string,
		nodeId: string,
		options: UpdateConstellationNodeOptions,
	): Promise<ConstellationNode> {
		const body: Record<string, unknown> = {};
		if (options.label) body.label = options.label;
		if (options.description) body.description = options.description;
		if (options.significance != null) body.significance = options.significance;
		if (options.nodeType) body.node_type = options.nodeType;

		return this.http.put<ConstellationNode>(
			`/api/v1/agents/${agentId}/constellation/nodes/${nodeId}`,
			body,
		);
	}

	/** Delete a constellation node. */
	async deleteConstellationNode(
		agentId: string,
		nodeId: string,
	): Promise<void> {
		await this.http.delete(
			`/api/v1/agents/${agentId}/constellation/nodes/${nodeId}`,
		);
	}

	/** List breakthroughs for an agent. */
	async listBreakthroughs(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<BreakthroughsResponse> {
		return this.http.get(`/api/v1/agents/${agentId}/breakthroughs`, {
			user_id: options.userId,
			instance_id: options.instanceId,
		});
	}

	/** @deprecated Use listBreakthroughs() instead. */
	async getBreakthroughs(
		agentId: string,
		options: ContextDataOptions = {},
	): Promise<BreakthroughsResponse> {
		return this.listBreakthroughs(agentId, options);
	}

	// -- Agent List --

	/** List agents with optional pagination, search, and project filtering. */
	async list(options?: AgentListOptions): Promise<AgentListResponse> {
		const params: Record<string, string> = {};
		if (options?.pageSize) params.page_size = String(options.pageSize);
		if (options?.cursor) params.cursor = options.cursor;
		if (options?.search) params.search = options.search;
		if (options?.projectId) params.project_id = options.projectId;
		return this.http.get<AgentListResponse>("/api/v1/agents", params);
	}

	// -- Agent Status --

	/** Set the active status of an agent. */
	async setStatus(
		agentId: string,
		options: SetStatusOptions,
	): Promise<SetStatusResponse> {
		return this.http.patch<SetStatusResponse>(
			`/api/v1/agents/${agentId}/status`,
			options as unknown as Record<string, unknown>,
		);
	}

	// -- Project Association --

	/** Update an agent's project association. */
	async updateProject(
		agentId: string,
		options: UpdateProjectOptions,
	): Promise<UpdateProjectResponse> {
		return this.http.patch<UpdateProjectResponse>(
			`/api/v1/agents/${agentId}/project`,
			options as unknown as Record<string, unknown>,
		);
	}

	// -- Capabilities --

	/** Get an agent's capabilities. */
	async getCapabilities(agentId: string): Promise<AgentCapabilities> {
		return this.http.get<AgentCapabilities>(
			`/api/v1/agents/${agentId}/capabilities`,
		);
	}

	/** Update an agent's capabilities. */
	async updateCapabilities(
		agentId: string,
		options: UpdateCapabilitiesOptions,
	): Promise<AgentCapabilities> {
		return this.http.put<AgentCapabilities>(
			`/api/v1/agents/${agentId}/capabilities`,
			options as unknown as Record<string, unknown>,
		);
	}

	// ------------------------------------------------------------------
	// Agent-scope post-processing override (layer 1 of the cascade)
	// ------------------------------------------------------------------

	/**
	 * Set the agent-level post-processing model override. Both
	 * `provider` and `model` must be non-empty for the cascade to honour
	 * the override — mixed-empty pairs act as "no override" (use
	 * `clearPostProcessingModel` for that).
	 *
	 * Short-circuits the cascade: when set, project / account /
	 * system-default layers are not consulted for this agent.
	 */
	async updatePostProcessingModel(
		agentId: string,
		override: { provider: string; model: string },
	): Promise<{
		success: boolean;
		post_processing_provider: string;
		post_processing_model: string;
	}> {
		return this.http.patch(`/api/v1/agents/${agentId}/post-processing-model`, {
			post_processing_provider: override.provider,
			post_processing_model: override.model,
		});
	}

	/**
	 * Remove the agent-level override so the cascade falls through to
	 * project / account / system-default layers. Equivalent to
	 * `updatePostProcessingModel(agentId, { provider: "", model: "" })`.
	 */
	async clearPostProcessingModel(
		agentId: string,
	): Promise<{ success: boolean }> {
		return this.http.patch(`/api/v1/agents/${agentId}/post-processing-model`, {
			post_processing_provider: "",
			post_processing_model: "",
		});
	}

	/**
	 * Run the cascade server-side for a given chat model, without firing
	 * inference. Useful for "which model would run my diary tonight?"
	 * UIs.
	 *
	 * When the server has `ENABLE_POST_PROCESSING_MODEL_MAP=false`, the
	 * response echoes the chat model itself — matches runtime behaviour
	 * on disabled deployments.
	 */
	async effectivePostProcessingModel(
		agentId: string,
		chatModel: string,
	): Promise<{
		provider: string;
		model: string;
		temperature?: number;
		max_tokens?: number;
	}> {
		const params = new URLSearchParams({ chat_model: chatModel });
		return this.http.get(
			`/api/v1/agents/${agentId}/effective-post-processing-model?${params.toString()}`,
		);
	}

	// -- Custom Tools --

	/** List custom tools for an agent. */
	async listCustomTools(agentId: string): Promise<CustomToolListResponse> {
		return this.http.get<CustomToolListResponse>(
			`/api/v1/agents/${agentId}/tools`,
		);
	}

	/** Create a custom tool for an agent. */
	async createCustomTool(
		agentId: string,
		options: CreateCustomToolOptions,
	): Promise<CustomToolDefinition> {
		return this.http.post<CustomToolDefinition>(
			`/api/v1/agents/${agentId}/tools`,
			options as unknown as Record<string, unknown>,
		);
	}

	/** Update a custom tool for an agent. */
	async updateCustomTool(
		agentId: string,
		toolName: string,
		options: UpdateCustomToolOptions,
	): Promise<{ success: boolean }> {
		return this.http.put<{ success: boolean }>(
			`/api/v1/agents/${agentId}/tools/${toolName}`,
			options as unknown as Record<string, unknown>,
		);
	}

	/** Delete a custom tool from an agent. */
	async deleteCustomTool(agentId: string, toolName: string): Promise<void> {
		return this.http.delete<void>(
			`/api/v1/agents/${agentId}/tools/${toolName}`,
		);
	}

	// -- Avatar Generation --

	/** Trigger avatar generation for an agent. */
	async generateAvatar(
		agentId: string,
		options?: GenerateAvatarOptions,
	): Promise<GenerateAvatarResponse> {
		return this.http.post<GenerateAvatarResponse>(
			`/api/v1/agents/${agentId}/avatar/generate`,
			(options ?? {}) as Record<string, unknown>,
		);
	}

	// -- Process (full pipeline) --

	/**
	 * Run the full Context Engine pipeline on conversation messages without
	 * generating a chat response. Extracts side effects via LLM, processes
	 * behavioral updates (mood, personality, habits, interests, relationships),
	 * stores memories, and runs session-end analysis.
	 */
	async process(
		agentId: string,
		options: ProcessOptions,
	): Promise<ProcessResponse> {
		requireNonEmpty(agentId, "agentId");
		requireNonEmpty(options.userId, "options.userId");
		const body: Record<string, unknown> = {
			userId: options.userId,
			messages: options.messages,
		};
		if (options.sessionId) body.sessionId = options.sessionId;
		if (options.instanceId) body.instanceId = options.instanceId;
		if (options.provider) body.provider = options.provider;
		if (options.model) body.model = options.model;
		return this.http.post<ProcessResponse>(
			`/api/v1/agents/${agentId}/process`,
			body,
		);
	}

	/** Get available LLM providers and models for the /process endpoint. */
	async getModels(agentId: string): Promise<ModelsResponse> {
		return this.http.get<ModelsResponse>(`/api/v1/agents/${agentId}/models`);
	}

	// -- Context (single-call enriched context) --

	/**
	 * Get the full enriched agent context in a single call.
	 * Returns all 7 layers (personality, mood, memory, relationships, goals, etc.)
	 * This replaces multiple individual API calls with one round-trip.
	 */
	async getContext(
		agentId: string,
		options: GetContextOptions,
	): Promise<EnrichedContextResponse> {
		requireNonEmpty(agentId, "agentId");
		requireNonEmpty(options.userId, "options.userId");
		const params: Record<string, string> = { userId: options.userId };
		if (options.sessionId) params.sessionId = options.sessionId;
		if (options.instanceId) params.instanceId = options.instanceId;
		if (options.query) params.query = options.query;
		if (options.language) params.language = options.language;
		if (options.timezone) params.timezone = options.timezone;
		const raw = await this.http.get<Record<string, unknown>>(
			`/api/v1/agents/${agentId}/context`,
			params,
		);
		// Remap legacy wire key → SDK field name (server still emits the old key).
		if ("game_context" in raw && !("backend_context" in raw)) {
			raw.backend_context = raw.game_context;
			delete raw.game_context;
		}
		return raw as EnrichedContextResponse;
	}

	// -- Consolidation --

	/** Trigger memory consolidation for an agent. */
	async consolidate(
		agentId: string,
		options?: ConsolidateOptions,
	): Promise<ConsolidateResponse> {
		return this.http.post<ConsolidateResponse>(
			`/api/v1/agents/${agentId}/memory/consolidate`,
			(options ?? {}) as Record<string, unknown>,
		);
	}

	/** Get memory summaries for an agent. */
	async getSummaries(
		agentId: string,
		options?: SummariesOptions,
	): Promise<SummariesResponse> {
		const params: Record<string, string> = {};
		if (options?.period) params.period = options.period;
		if (options?.limit) params.limit = String(options.limit);
		return this.http.get<SummariesResponse>(
			`/api/v1/agents/${agentId}/memory/summaries`,
			params,
		);
	}

	// -- Time Machine --

	/** Get a point-in-time snapshot of an agent's personality and mood. */
	async getTimeMachine(
		agentId: string,
		options: TimeMachineOptions,
	): Promise<TimeMachineResponse> {
		const params: Record<string, string> = { at: options.at };
		if (options.userId) params.user_id = options.userId;
		if (options.instanceId) params.instance_id = options.instanceId;
		return this.http.get<TimeMachineResponse>(
			`/api/v1/agents/${agentId}/timemachine`,
			params,
		);
	}

	// -- Knowledge Search (tool endpoint) --

	/** Search the knowledge base for an agent. */
	async knowledgeSearch(
		agentId: string,
		options: AgentKBSearchOptions,
	): Promise<AgentKBSearchResponse> {
		requireNonEmpty(agentId, "agentId");
		const body: Record<string, unknown> = { query: options.query };
		if (options.limit != null) body.limit = options.limit;
		return this.http.post<AgentKBSearchResponse>(
			`/api/v1/agents/${agentId}/tools/kb-search`,
			body,
		);
	}

	// -- Tool Schemas (BYO-LLM) --

	/** Get tool schemas available for an agent (for BYO-LLM integrations). */
	async getTools(agentId: string): Promise<ToolSchemasResponse> {
		requireNonEmpty(agentId, "agentId");
		return this.http.get<ToolSchemasResponse>(
			`/api/v1/agents/${agentId}/tools`,
		);
	}

	/** Get OpenAPI-style tool schemas for BYO-LLM tool calling. */
	async getToolSchemas(agentId: string): Promise<GetToolSchemasResponse> {
		requireNonEmpty(agentId, "agentId");
		return this.http.get<GetToolSchemasResponse>(
			`/api/v1/agents/${agentId}/tools/schemas`,
		);
	}

	// -- Fork --

	/** Fork an agent (create a copy with a new ID). */
	async fork(
		agentId: string,
		options?: ForkAgentOptions,
	): Promise<ForkResponse> {
		requireNonEmpty(agentId, "agentId");
		const body: Record<string, unknown> = {};
		if (options?.name) body.name = options.name;
		return this.http.post<ForkResponse>(`/api/v1/agents/${agentId}/fork`, body);
	}

	/** Check the status of a fork operation. */
	async getForkStatus(agentId: string): Promise<ForkStatusResponse> {
		requireNonEmpty(agentId, "agentId");
		return this.http.get<ForkStatusResponse>(
			`/api/v1/agents/${agentId}/fork/status`,
		);
	}

	// -- Playground Chat --

	/** Send a playground chat message (non-streaming). Same as chat but via the playground endpoint. */
	async playgroundChat(options: ChatOptions): Promise<ChatResponse> {
		const body = this.buildChatBody(options);
		const parts: string[] = [];
		let usage: ChatUsage | undefined;

		for await (const event of this.http.streamSSE(
			"POST",
			`/api/v1/agents/${options.agent}/playground/chat`,
			body,
		)) {
			const parsed = event as ChatStreamEvent;
			const content = parsed.choices?.[0]?.delta?.content;
			if (content) parts.push(content);
			if (parsed.usage) usage = parsed.usage;
		}

		return { content: parts.join(""), sessionId: "", usage };
	}

	/** Send a playground chat message and stream events as an async iterator. */
	async *playgroundChatStream(
		options: ChatOptions,
	): AsyncGenerator<ChatStreamEvent> {
		requireNonEmpty(options.agent, "agentId");
		const body = this.buildChatBody(options);
		for await (const event of this.http.streamSSE(
			"POST",
			`/api/v1/agents/${options.agent}/playground/chat`,
			body,
		)) {
			yield event as ChatStreamEvent;
		}
	}

	// -- Knowledge Search GET --

	/** Search the knowledge base using a GET request with query parameters. */
	async knowledgeSearchGet(
		agentId: string,
		options: { query: string; limit?: number },
	): Promise<AgentKBSearchResponse> {
		requireNonEmpty(agentId, "agentId");
		const params: Record<string, string | number> = { q: options.query };
		if (options.limit != null) params.limit = options.limit;
		return this.http.get<AgentKBSearchResponse>(
			`/api/v1/agents/${agentId}/tools/kb-search`,
			params,
		);
	}

	/**
	 * Update an agent's Big5 personality scores (and optional fine-grained
	 * dimensions). Mirrors the Go SDK's `AgentsResource.UpdatePersonality` —
	 * a PATCH to `/api/v1/agents/{agentId}/personality`.
	 */
	async updatePersonality(
		agentId: string,
		options: UpdatePersonalityOptions,
	): Promise<UpdatePersonalityResponse> {
		requireNonEmpty(agentId, "agentId");
		return this.http.patch<UpdatePersonalityResponse>(
			`/api/v1/agents/${agentId}/personality`,
			options as unknown as Record<string, unknown>,
		);
	}

	private buildChatBody(options: ChatOptions): Record<string, unknown> {
		const body: Record<string, unknown> = { messages: options.messages };
		if (options.userId) body.user_id = options.userId;
		if (options.userDisplayName)
			body.user_display_name = options.userDisplayName;
		if (options.sessionId) body.session_id = options.sessionId;
		if (options.instanceId) body.instance_id = options.instanceId;
		if (options.provider) body.provider = options.provider;
		if (options.model) body.model = options.model;
		if (options.continuationToken)
			body.continuation_token = options.continuationToken;
		if (options.requestType) body.request_type = options.requestType;
		if (options.language) body.language = options.language;
		if (options.compiledSystemPrompt)
			body.compiled_system_prompt = options.compiledSystemPrompt;
		if (options.interactionRole)
			body.interaction_role = options.interactionRole;
		if (options.timezone) body.timezone = options.timezone;
		if (options.toolCapabilities)
			body.tool_capabilities = options.toolCapabilities;
		if (options.toolDefinitions)
			body.tool_definitions = options.toolDefinitions;
		if (options.maxTurns) body.max_turns = options.maxTurns;
		// Explicit undefined check: temperature: 0 is a legitimate value
		// and must reach the wire as `"temperature": 0`. The Platform
		// reconciles provider-specific constraints downstream.
		if (options.temperature !== undefined)
			body.temperature = options.temperature;
		if (options.skipContextBuild)
			body.skip_context_build = options.skipContextBuild;
		if (options.gameContext) body.game_context = options.gameContext;
		if (options.skillLevels) body.skill_levels = options.skillLevels;
		return body;
	}
}

// ---------------------------------------------------------------------------
// Detached-signal helper
//
// The TypeScript analogue of sonzai-go's detachContext: build a fresh
// AbortController (deliberately NOT chained to the caller's signal) that
// fires only on the SDK-managed timeout, while watching the caller's
// parentSignal to surface a warning if it fires mid-stream. The whole
// point is that parentSignal cancellation does NOT propagate to fetch.
// ---------------------------------------------------------------------------
function createDetachedSignal(opts: DetachOptions): {
	signal: AbortSignal;
	dispose: () => void;
} {
	const timeoutMs = opts.timeoutMs ?? DEFAULT_DETACHED_TIMEOUT_MS;

	const inner = new AbortController();
	// Compose with AbortSignal.timeout when a positive timeout was
	// configured (timeoutMs <= 0 means "no SDK-managed timeout", a rare
	// power-user flag mirroring the Go SDK's negative-Timeout convention).
	const signal: AbortSignal =
		timeoutMs > 0
			? AbortSignal.any([inner.signal, AbortSignal.timeout(timeoutMs)])
			: inner.signal;

	let finished = false;
	let parentListener: (() => void) | null = null;
	const parent = opts.parentSignal;

	if (parent) {
		parentListener = () => {
			// Only surface the warning if the underlying call is still
			// running — silent no-op if the call already completed.
			if (finished) return;
			if (opts.onParentCancel) {
				try {
					opts.onParentCancel();
				} catch {
					// Swallow callback errors — they are observability, not
					// control flow.
				}
				return;
			}
			const logger = opts.logger ?? {
				warn: (msg: string, meta?: Record<string, unknown>) =>
					// eslint-disable-next-line no-console
					console.warn(msg, meta),
			};
			logger.warn(
				"sonzai: parent AbortSignal fired during detached streaming call; " +
					"call continues until completion or detached timeout — this " +
					"usually indicates the wrong helper is being used (use the " +
					"non-detached chat / chatStream when the caller's signal " +
					"lifetime exceeds the generation)",
				{ detached_timeout_ms: timeoutMs },
			);
		};
		if (parent.aborted) {
			parentListener();
		} else {
			parent.addEventListener("abort", parentListener, { once: true });
		}
	}

	const dispose = (): void => {
		finished = true;
		if (parent && parentListener) {
			parent.removeEventListener("abort", parentListener);
			parentListener = null;
		}
		// Aborting the inner controller is a no-op once the fetch has
		// finished but ensures any racing fetch-cleanup wakes up promptly.
		if (!inner.signal.aborted) inner.abort();
	};

	return { signal, dispose };
}

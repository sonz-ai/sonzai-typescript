import type { HTTPClient } from "../http.js";
import type {
  Agent,
  BreakthroughsResponse,
  ChatOptions,
  ChatResponse,
  ChatStreamEvent,
  ChatUsage,
  ConstellationResponse,
  ContextDataOptions,
  CreateAgentOptions,
  DialogueOptions,
  DialogueResponse,
  DiaryResponse,
  EvalOnlyOptions,
  EvaluateOptions,
  EvaluationResult,
  GoalsResponse,
  HabitsResponse,
  InterestsResponse,
  MoodAggregateResponse,
  MoodResponse,
  RelationshipResponse,
  RunEvalOptions,
  ScheduleWakeupOptions,
  ScheduledWakeup,
  SimulateOptions,
  SimulationEvent,
  TriggerEventOptions,
  TriggerEventResponse,
  UpdateAgentOptions,
  UsersResponse,
  WakeupsResponse,
} from "../types.js";
import { CustomStates } from "./custom-states.js";
import { Generation } from "./generation.js";
import { Instances } from "./instances.js";
import { Memory } from "./memory.js";
import { Notifications } from "./notifications.js";
import { Personality } from "./personality.js";
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

  constructor(private readonly http: HTTPClient) {
    this.memory = new Memory(http);
    this.personality = new Personality(http);
    this.sessions = new Sessions(http);
    this.instances = new Instances(http);
    this.notifications = new Notifications(http);
    this.customStates = new CustomStates(http);
    this.voice = new Voice(http);
    this.generation = new Generation(http);
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
    if (options.toolCapabilities)
      body.tool_capabilities = options.toolCapabilities;
    if (options.language) body.language = options.language;
    if (options.seedMemories) body.seed_memories = options.seedMemories;
    if (options.loreContext)
      body.lore_generation_context = options.loreContext;
    if (options.generateOriginStory != null)
      body.generate_origin_story = options.generateOriginStory;
    if (options.generatePersonalizedMemories != null)
      body.generate_personalized_memories =
        options.generatePersonalizedMemories;

    return this.http.post<Agent>("/api/v1/agents", body);
  }

  /** Get an agent by ID. */
  async get(agentId: string): Promise<Agent> {
    return this.http.get<Agent>(`/api/v1/agents/${agentId}`);
  }

  /** Update an agent's profile. */
  async update(agentId: string, options: UpdateAgentOptions): Promise<Agent> {
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
    await this.http.delete(`/api/v1/agents/${agentId}`);
  }

  // -- Chat --

  /** Send a chat message (non-streaming). Consumes the SSE stream and returns aggregated content. */
  async chat(agentId: string, options: ChatOptions): Promise<ChatResponse> {
    const body = this.buildChatBody(options);
    const parts: string[] = [];
    let usage: ChatUsage | undefined;

    for await (const event of this.http.streamSSE(
      "POST",
      `/api/v1/agents/${agentId}/chat`,
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
  async *chatStream(
    agentId: string,
    options: ChatOptions,
  ): AsyncGenerator<ChatStreamEvent> {
    const body = this.buildChatBody(options);
    for await (const event of this.http.streamSSE(
      "POST",
      `/api/v1/agents/${agentId}/chat`,
      body,
    )) {
      yield event as ChatStreamEvent;
    }
  }

  // -- Dialogue --

  /** Initiate a dialogue with an agent. */
  async dialogue(
    agentId: string,
    options: DialogueOptions,
  ): Promise<DialogueResponse> {
    const body: Record<string, unknown> = {};
    if (options.userId) body.user_id = options.userId;
    if (options.enrichedContext)
      body.enriched_context = options.enrichedContext;
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

  /** Trigger a game event / activity for an agent. */
  async triggerGameEvent(
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
    const body: Record<string, unknown> = {
      user_id: options.userId,
      scheduled_at: options.scheduledAt,
      check_type: options.checkType,
    };
    if (options.intent) body.intent = options.intent;
    if (options.occasion) body.occasion = options.occasion;
    if (options.interestTopic) body.interest_topic = options.interestTopic;
    if (options.eventDescription)
      body.event_description = options.eventDescription;

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

  /** Run a simulation and stream events. */
  async *simulate(
    agentId: string,
    options: SimulateOptions = {},
  ): AsyncGenerator<SimulationEvent> {
    const body: Record<string, unknown> = {};
    if (options.sessions) body.sessions = options.sessions;
    if (options.userPersona) body.user_persona = options.userPersona;
    if (options.config) body.config = options.config;
    if (options.model) body.model = options.model;
    if (options.configOverride) body.config_override = options.configOverride;

    for await (const event of this.http.streamSSE(
      "POST",
      `/api/v1/agents/${agentId}/simulate`,
      body,
    )) {
      yield event as SimulationEvent;
    }
  }

  /** Run simulation + evaluation combined. */
  async *runEval(
    agentId: string,
    options: RunEvalOptions,
  ): AsyncGenerator<SimulationEvent> {
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

    for await (const event of this.http.streamSSE(
      "POST",
      `/api/v1/agents/${agentId}/run-eval`,
      body,
    )) {
      yield event as SimulationEvent;
    }
  }

  /** Re-evaluate an existing run. */
  async *evalOnly(
    agentId: string,
    options: EvalOnlyOptions,
  ): AsyncGenerator<SimulationEvent> {
    const body: Record<string, unknown> = {
      template_id: options.templateId,
      source_run_id: options.sourceRunId,
    };
    if (options.adaptationTemplateId)
      body.adaptation_template_id = options.adaptationTemplateId;

    for await (const event of this.http.streamSSE(
      "POST",
      `/api/v1/agents/${agentId}/eval-only`,
      body,
    )) {
      yield event as SimulationEvent;
    }
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
  ): Promise<MoodResponse> {
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

  async getHabits(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<HabitsResponse> {
    return this.http.get(`/api/v1/agents/${agentId}/habits`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getGoals(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<GoalsResponse> {
    return this.http.get(`/api/v1/agents/${agentId}/goals`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
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

  async getUsers(agentId: string): Promise<UsersResponse> {
    return this.http.get(`/api/v1/agents/${agentId}/users`);
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

  /** Get breakthroughs for an agent. */
  async getBreakthroughs(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<BreakthroughsResponse> {
    return this.http.get(`/api/v1/agents/${agentId}/breakthroughs`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
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
    if (options.aiServiceCookie)
      body.ai_service_cookie = options.aiServiceCookie;
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
    return body;
  }
}

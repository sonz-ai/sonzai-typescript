import type { HTTPClient } from "../http.js";
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamEvent,
  ChatUsage,
  ContextDataOptions,
  EvalOnlyOptions,
  EvaluateOptions,
  EvaluationResult,
  RunEvalOptions,
  SimulateOptions,
  SimulationEvent,
} from "../types.js";
import { Instances } from "./instances.js";
import { Memory } from "./memory.js";
import { Notifications } from "./notifications.js";
import { Personality } from "./personality.js";
import { Sessions } from "./sessions.js";

export class Agents {
  readonly memory: Memory;
  readonly personality: Personality;
  readonly sessions: Sessions;
  readonly instances: Instances;
  readonly notifications: Notifications;

  constructor(private readonly http: HTTPClient) {
    this.memory = new Memory(http);
    this.personality = new Personality(http);
    this.sessions = new Sessions(http);
    this.instances = new Instances(http);
    this.notifications = new Notifications(http);
  }

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
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/mood`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getMoodHistory(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/mood-history`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getRelationships(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/relationships`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getHabits(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/habits`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getGoals(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/goals`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getInterests(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/interests`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getDiary(
    agentId: string,
    options: ContextDataOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/diary`, {
      user_id: options.userId,
      instance_id: options.instanceId,
    });
  }

  async getUsers(agentId: string): Promise<Record<string, unknown>> {
    return this.http.get(`/api/v1/agents/${agentId}/users`);
  }

  private buildChatBody(options: ChatOptions): Record<string, unknown> {
    const body: Record<string, unknown> = { messages: options.messages };
    if (options.userId) body.user_id = options.userId;
    if (options.sessionId) body.session_id = options.sessionId;
    if (options.instanceId) body.instance_id = options.instanceId;
    return body;
  }
}

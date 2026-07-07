import type { HTTPClient } from "../http.js";
import type {
	ConversationDetailBody,
	ConversationListOptions,
	ConversationMessageListOptions,
	ConversationPushOptions,
	ConversationPushResult,
	ConversationSendAsAgentOptions,
	ConversationStreamEvent,
	ConversationStreamOptions,
	ConversationTakeOverOptions,
	ConversationUpdateOptions,
	ListConversationMessagesOutputBody,
	ListConversationsOutputBody,
	OmnichannelConversationDTO,
} from "../types.js";

function requireNonEmpty(value: string, name: string): void {
	if (!value || typeof value !== "string" || value.trim() === "") {
		throw new Error(`${name} must be a non-empty string`);
	}
}

/** Omnichannel conversation management and live event streaming. */
export class Conversations {
	constructor(private readonly http: HTTPClient) {}

	/** List conversations. Cursor-paginated. */
	async list(
		options: ConversationListOptions = {},
	): Promise<ListConversationsOutputBody> {
		return this.http.get<ListConversationsOutputBody>("/api/v1/conversations", {
			project_id: options.projectId,
			channel: options.channel,
			agent_id: options.agentId,
			user_id: options.userId,
			controller: options.controller,
			status: options.status,
			q: options.q,
			cursor: options.cursor,
			limit: options.limit,
		});
	}

	/** Get a conversation by ID. */
	async get(conversationId: string): Promise<ConversationDetailBody> {
		requireNonEmpty(conversationId, "conversationId");
		return this.http.get<ConversationDetailBody>(
			`/api/v1/conversations/${conversationId}`,
		);
	}

	/** List messages for a conversation. Cursor-paginated. */
	async messages(
		conversationId: string,
		options: ConversationMessageListOptions = {},
	): Promise<ListConversationMessagesOutputBody> {
		requireNonEmpty(conversationId, "conversationId");
		return this.http.get<ListConversationMessagesOutputBody>(
			`/api/v1/conversations/${conversationId}/messages`,
			{
				cursor: options.cursor,
				limit: options.limit,
			},
		);
	}

	/** Stream conversation events as an async iterator. */
	async *stream(
		options: ConversationStreamOptions = {},
	): AsyncGenerator<ConversationStreamEvent> {
		for await (const event of this.http.streamSSE(
			"GET",
			options.projectId
				? `/api/v1/conversations/stream?project_id=${encodeURIComponent(
						options.projectId,
					)}`
				: "/api/v1/conversations/stream",
		)) {
			yield event as ConversationStreamEvent;
		}
	}

	/** Put the conversation under human/operator control. */
	async takeOver(
		conversationId: string,
		options: ConversationTakeOverOptions = {},
	): Promise<OmnichannelConversationDTO> {
		requireNonEmpty(conversationId, "conversationId");
		return this.http.post<OmnichannelConversationDTO>(
			`/api/v1/conversations/${conversationId}/takeover`,
			{},
			{
				operator_id: options.operatorId,
				force: options.force,
			},
		);
	}

	/** Release human/operator control back to the agent. */
	async release(conversationId: string): Promise<OmnichannelConversationDTO> {
		requireNonEmpty(conversationId, "conversationId");
		return this.http.delete<OmnichannelConversationDTO>(
			`/api/v1/conversations/${conversationId}/takeover`,
		);
	}

	/** Send a conversation message as the agent/operator side. */
	async sendAsAgent(
		conversationId: string,
		options: ConversationSendAsAgentOptions,
	): Promise<OmnichannelConversationDTO> {
		requireNonEmpty(conversationId, "conversationId");
		return this.http.post<OmnichannelConversationDTO>(
			`/api/v1/conversations/${conversationId}/messages`,
			options as unknown as Record<string, unknown>,
		);
	}

	/** Mark all messages in a conversation as read. */
	async markRead(conversationId: string): Promise<OmnichannelConversationDTO> {
		requireNonEmpty(conversationId, "conversationId");
		return this.http.post<OmnichannelConversationDTO>(
			`/api/v1/conversations/${conversationId}/read`,
		);
	}

	/** Update conversation metadata such as status or assigned agent. */
	async update(
		conversationId: string,
		options: ConversationUpdateOptions,
	): Promise<OmnichannelConversationDTO> {
		requireNonEmpty(conversationId, "conversationId");
		const body: Record<string, unknown> = {};
		if (options.agentId) body.agent_id = options.agentId;
		if (options.status) body.status = options.status;
		return this.http.patch<OmnichannelConversationDTO>(
			`/api/v1/conversations/${conversationId}`,
			body,
		);
	}

	/**
	 * Push a proactive agent-authored message to a user's connected messaging
	 * channel (WhatsApp/Messenger/Instagram) without waiting for an inbound
	 * message. Honours the WhatsApp 24h customer-service window: outside it,
	 * the connection's approved re-engagement template is used, and the call
	 * fails with 422 when no template is configured.
	 */
	async push(
		options: ConversationPushOptions,
	): Promise<ConversationPushResult> {
		requireNonEmpty(options.agentId, "agentId");
		requireNonEmpty(options.userId, "userId");
		requireNonEmpty(options.content, "content");
		const body: Record<string, unknown> = {
			agent_id: options.agentId,
			user_id: options.userId,
			content: options.content,
		};
		if (options.projectId) body.project_id = options.projectId;
		if (options.channelType) body.channel_type = options.channelType;
		if (options.connectionId) body.connection_id = options.connectionId;
		return this.http.post<ConversationPushResult>(
			"/api/v1/conversations/push",
			body,
		);
	}
}

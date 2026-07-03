import type { HTTPClient } from "../http.js";
import type {
	ChannelConnectionCreateOptions,
	ChannelConnectionDTO,
	ChannelConnectionTestOptions,
	ChannelConnectionUpdateOptions,
	ChannelConnectionsOutputBody,
} from "../types.js";

function requireNonEmpty(value: string, name: string): void {
	if (!value || typeof value !== "string" || value.trim() === "") {
		throw new Error(`${name} must be a non-empty string`);
	}
}

const SECRET_FIELDS = new Set([
	"accessToken",
	"access_token",
	"appSecret",
	"app_secret",
	"verifyToken",
	"verify_token",
]);

function toCreateBody(
	options: ChannelConnectionCreateOptions,
): Record<string, unknown> {
	const body: Record<string, unknown> = {
		channel_type: options.channelType,
	};
	if (options.providerMode) body.provider_mode = options.providerMode;
	if (options.appId) body.app_id = options.appId;
	if (options.appSecret) body.app_secret = options.appSecret;
	if (options.phoneNumberId) body.phone_number_id = options.phoneNumberId;
	if (options.wabaId) body.waba_id = options.wabaId;
	if (options.pageId) body.page_id = options.pageId;
	if (options.igAccountId) body.ig_account_id = options.igAccountId;
	if (options.accessToken) body.access_token = options.accessToken;
	if (options.verifyToken) body.verify_token = options.verifyToken;
	if (options.displayName) body.display_name = options.displayName;
	if (options.defaultAgentId) body.default_agent_id = options.defaultAgentId;
	if (options.code) body.code = options.code;
	if (options.templates !== undefined) body.templates = options.templates;
	if (options.testTo) body.test_to = options.testTo;
	if (options.testMessage) body.test_message = options.testMessage;
	return body;
}

/** Redact secret Meta channel fields before logging or JSON serialization. */
export function redactChannelConnectionSecrets<
	T extends Record<string, unknown>,
>(value: T): T {
	const redacted: Record<string, unknown> = { ...value };
	for (const key of Object.keys(redacted)) {
		if (SECRET_FIELDS.has(key) && redacted[key] !== undefined) {
			redacted[key] = "[REDACTED]";
		}
	}
	return redacted as T;
}

function redactConnection(
	connection: ChannelConnectionDTO,
): ChannelConnectionDTO {
	return redactChannelConnectionSecrets(
		connection as unknown as Record<string, unknown>,
	) as unknown as ChannelConnectionDTO;
}

/** Project-scoped Meta channel connection management. */
export class ChannelConnections {
	constructor(private readonly http: HTTPClient) {}

	/** List all channel connections for a project. */
	async list(projectId: string): Promise<ChannelConnectionsOutputBody> {
		requireNonEmpty(projectId, "projectId");
		const data = await this.http.get<ChannelConnectionsOutputBody>(
			`/api/v1/projects/${projectId}/channel-connections`,
		);
		return {
			...data,
			connections: data.connections?.map(redactConnection) ?? null,
			items: data.items?.map(redactConnection) ?? null,
		};
	}

	/** Create a new Meta channel connection. */
	async create(
		projectId: string,
		options: ChannelConnectionCreateOptions,
	): Promise<ChannelConnectionDTO> {
		requireNonEmpty(projectId, "projectId");
		const connection = await this.http.post<ChannelConnectionDTO>(
			`/api/v1/projects/${projectId}/channel-connections`,
			toCreateBody(options),
		);
		return redactConnection(connection);
	}

	/** Get a channel connection by ID. */
	async get(
		projectId: string,
		connectionId: string,
	): Promise<ChannelConnectionDTO> {
		requireNonEmpty(projectId, "projectId");
		requireNonEmpty(connectionId, "connectionId");
		const connection = await this.http.get<ChannelConnectionDTO>(
			`/api/v1/projects/${projectId}/channel-connections/${connectionId}`,
		);
		return redactConnection(connection);
	}

	/** Update channel connection state or defaults. */
	async update(
		projectId: string,
		connectionId: string,
		options: ChannelConnectionUpdateOptions,
	): Promise<ChannelConnectionDTO> {
		requireNonEmpty(projectId, "projectId");
		requireNonEmpty(connectionId, "connectionId");
		const body: Record<string, unknown> = {};
		if (options.defaultAgentId) body.default_agent_id = options.defaultAgentId;
		if (options.status) body.status = options.status;
		if (options.templates !== undefined) body.templates = options.templates;
		const connection = await this.http.patch<ChannelConnectionDTO>(
			`/api/v1/projects/${projectId}/channel-connections/${connectionId}`,
			body,
		);
		return redactConnection(connection);
	}

	/** Delete a channel connection. */
	async delete(projectId: string, connectionId: string): Promise<void> {
		requireNonEmpty(projectId, "projectId");
		requireNonEmpty(connectionId, "connectionId");
		await this.http.delete(
			`/api/v1/projects/${projectId}/channel-connections/${connectionId}`,
		);
	}

	/** Send a test message through a channel connection. */
	async test(
		projectId: string,
		connectionId: string,
		options: ChannelConnectionTestOptions,
	): Promise<ChannelConnectionDTO> {
		requireNonEmpty(projectId, "projectId");
		requireNonEmpty(connectionId, "connectionId");
		const connection = await this.http.post<ChannelConnectionDTO>(
			`/api/v1/projects/${projectId}/channel-connections/${connectionId}/test`,
			{
				to: options.to,
				message: options.message,
			},
		);
		return redactConnection(connection);
	}
}

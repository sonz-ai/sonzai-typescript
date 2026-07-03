import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
	CONVERSATION_WEBHOOK_EVENTS,
	Sonzai,
	redactChannelConnectionSecrets,
} from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
	return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

const conversation = {
	conversation_id: "conv-1",
	project_id: "proj-1",
	agent_id: "agent-1",
	user_id: "user-1",
	channel_type: "whatsapp",
	controller: "agent",
	status: "open",
	last_message_at: "2026-07-03T00:00:00Z",
	unread_count: 1,
	handoffs: [],
	meta: {},
	created_at: "2026-07-03T00:00:00Z",
	updated_at: "2026-07-03T00:00:00Z",
};

const connection = {
	connection_id: "conn-1",
	project_id: "proj-1",
	channel_type: "whatsapp",
	provider_mode: "byo_app",
	display_name: "Support WhatsApp",
	status: "active",
	verify_token: "verify-secret",
	created_at: "2026-07-03T00:00:00Z",
	updated_at: "2026-07-03T00:00:00Z",
};

describe("Conversations", () => {
	it("lists conversations with supported filters", async () => {
		let captured: { method: string; url: string } | null = null;
		server.use(
			http.get(`${BASE_URL}/api/v1/conversations`, ({ request }) => {
				captured = { method: request.method, url: request.url };
				return HttpResponse.json({
					conversations: [conversation],
					items: [conversation],
					total: 1,
					has_more: false,
				});
			}),
		);

		const res = await client().conversations.list({
			projectId: "proj-1",
			channel: "whatsapp",
			agentId: "agent-1",
			userId: "user-1",
			controller: "agent",
			status: "open",
			q: "hello",
			cursor: "cur-1",
			limit: 25,
		});

		expect(captured).not.toBeNull();
		expect(captured?.method).toBe("GET");
		expect(captured?.url).toBe(
			`${BASE_URL}/api/v1/conversations?project_id=proj-1&channel=whatsapp&agent_id=agent-1&user_id=user-1&controller=agent&status=open&q=hello&cursor=cur-1&limit=25`,
		);
		expect(res.conversations?.[0]?.conversation_id).toBe("conv-1");
	});

	it("gets conversation messages with cursor pagination", async () => {
		let captured: { method: string; url: string } | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/conversations/conv-1/messages`,
				({ request }) => {
					captured = { method: request.method, url: request.url };
					return HttpResponse.json({
						messages: [
							{
								message_id: "msg-1",
								conversation_id: "conv-1",
								direction: "inbound",
								author_type: "user",
								role: "user",
								content: "Hello",
								created_at: "2026-07-03T00:00:00Z",
							},
						],
						items: [],
						has_more: false,
					});
				},
			),
		);

		const res = await client().conversations.messages("conv-1", {
			cursor: "cur-2",
			limit: 10,
		});

		expect(captured).not.toBeNull();
		expect(captured?.method).toBe("GET");
		expect(captured?.url).toBe(
			`${BASE_URL}/api/v1/conversations/conv-1/messages?cursor=cur-2&limit=10`,
		);
		expect(res.messages?.[0]?.message_id).toBe("msg-1");
	});

	it("streams conversation SSE events", async () => {
		let capturedUrl: string | null = null;
		server.use(
			http.get(`${BASE_URL}/api/v1/conversations/stream`, ({ request }) => {
				capturedUrl = request.url;
				const body = [
					`data: ${JSON.stringify({
						type: CONVERSATION_WEBHOOK_EVENTS.MESSAGE,
						conversation_id: "conv-1",
					})}`,
					"",
					"data: [DONE]",
					"",
				].join("\n");
				return new HttpResponse(body, {
					headers: { "Content-Type": "text/event-stream" },
				});
			}),
		);

		const events = [];
		for await (const event of client().conversations.stream({
			projectId: "proj-1",
		})) {
			events.push(event);
		}

		expect(capturedUrl).toBe(
			`${BASE_URL}/api/v1/conversations/stream?project_id=proj-1`,
		);
		expect(events).toHaveLength(1);
		expect(events[0]?.type).toBe("conversation.message");
	});

	it("maps takeover options to the platform query parameters", async () => {
		let captured: { method: string; url: string; body: unknown } | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/conversations/conv-1/takeover`,
				async ({ request }) => {
					captured = {
						method: request.method,
						url: request.url,
						body: await request.json(),
					};
					return HttpResponse.json({
						...conversation,
						controller: "human",
						controller_operator_id: "op-1",
					});
				},
			),
		);

		const res = await client().conversations.takeOver("conv-1", {
			operatorId: "op-1",
			force: true,
		});

		expect(captured).not.toBeNull();
		expect(captured?.method).toBe("POST");
		expect(captured?.url).toBe(
			`${BASE_URL}/api/v1/conversations/conv-1/takeover?operator_id=op-1&force=true`,
		);
		expect(captured?.body).toEqual({});
		expect(res.controller).toBe("human");
	});

	it("sends, marks read, updates, and releases conversations", async () => {
		const calls: Array<{ method: string; url: string; body?: unknown }> = [];
		server.use(
			http.post(
				`${BASE_URL}/api/v1/conversations/conv-1/messages`,
				async ({ request }) => {
					calls.push({
						method: request.method,
						url: request.url,
						body: await request.json(),
					});
					return HttpResponse.json(conversation);
				},
			),
			http.post(
				`${BASE_URL}/api/v1/conversations/conv-1/read`,
				({ request }) => {
					calls.push({ method: request.method, url: request.url });
					return HttpResponse.json({ ...conversation, unread_count: 0 });
				},
			),
			http.patch(
				`${BASE_URL}/api/v1/conversations/conv-1`,
				async ({ request }) => {
					calls.push({
						method: request.method,
						url: request.url,
						body: await request.json(),
					});
					return HttpResponse.json({ ...conversation, status: "closed" });
				},
			),
			http.delete(
				`${BASE_URL}/api/v1/conversations/conv-1/takeover`,
				({ request }) => {
					calls.push({ method: request.method, url: request.url });
					return HttpResponse.json({ ...conversation, controller: "agent" });
				},
			),
		);

		await client().conversations.sendAsAgent("conv-1", {
			content: "Hi",
			attachments: [{ url: "https://example.com/a.png" }],
		});
		await client().conversations.markRead("conv-1");
		await client().conversations.update("conv-1", {
			agentId: "agent-2",
			status: "closed",
		});
		await client().conversations.release("conv-1");

		expect(calls).toEqual([
			{
				method: "POST",
				url: `${BASE_URL}/api/v1/conversations/conv-1/messages`,
				body: {
					content: "Hi",
					attachments: [{ url: "https://example.com/a.png" }],
				},
			},
			{
				method: "POST",
				url: `${BASE_URL}/api/v1/conversations/conv-1/read`,
			},
			{
				method: "PATCH",
				url: `${BASE_URL}/api/v1/conversations/conv-1`,
				body: { agent_id: "agent-2", status: "closed" },
			},
			{
				method: "DELETE",
				url: `${BASE_URL}/api/v1/conversations/conv-1/takeover`,
			},
		]);
	});
});

describe("ChannelConnections", () => {
	it("creates a BYO Meta channel connection with snake_case body fields", async () => {
		let captured: { method: string; url: string; body: unknown } | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/projects/proj-1/channel-connections`,
				async ({ request }) => {
					captured = {
						method: request.method,
						url: request.url,
						body: await request.json(),
					};
					return HttpResponse.json(connection);
				},
			),
		);

		const res = await client().channelConnections.create("proj-1", {
			channelType: "whatsapp",
			providerMode: "byo_app",
			appId: "app-1",
			appSecret: "app-secret",
			phoneNumberId: "phone-1",
			wabaId: "waba-1",
			accessToken: "access-secret",
			verifyToken: "verify-secret",
			displayName: "Support WhatsApp",
		});

		expect(captured).not.toBeNull();
		expect(captured?.method).toBe("POST");
		expect(captured?.url).toBe(
			`${BASE_URL}/api/v1/projects/proj-1/channel-connections`,
		);
		expect(captured?.body).toEqual({
			channel_type: "whatsapp",
			provider_mode: "byo_app",
			app_id: "app-1",
			app_secret: "app-secret",
			phone_number_id: "phone-1",
			waba_id: "waba-1",
			access_token: "access-secret",
			verify_token: "verify-secret",
			display_name: "Support WhatsApp",
		});
		expect(JSON.stringify(res)).not.toContain("verify-secret");
		expect(res.verify_token).toBe("[REDACTED]");
	});

	it("lists, gets, updates, deletes, and tests channel connections", async () => {
		const calls: Array<{ method: string; url: string; body?: unknown }> = [];
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/proj-1/channel-connections`,
				({ request }) => {
					calls.push({ method: request.method, url: request.url });
					return HttpResponse.json({
						connections: [connection],
						items: [connection],
					});
				},
			),
			http.get(
				`${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1`,
				({ request }) => {
					calls.push({ method: request.method, url: request.url });
					return HttpResponse.json(connection);
				},
			),
			http.patch(
				`${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1`,
				async ({ request }) => {
					calls.push({
						method: request.method,
						url: request.url,
						body: await request.json(),
					});
					return HttpResponse.json(connection);
				},
			),
			http.delete(
				`${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1`,
				({ request }) => {
					calls.push({ method: request.method, url: request.url });
					return new HttpResponse(null, { status: 204 });
				},
			),
			http.post(
				`${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1/test`,
				async ({ request }) => {
					calls.push({
						method: request.method,
						url: request.url,
						body: await request.json(),
					});
					return HttpResponse.json(connection);
				},
			),
		);

		const list = await client().channelConnections.list("proj-1");
		const got = await client().channelConnections.get("proj-1", "conn-1");
		await client().channelConnections.update("proj-1", "conn-1", {
			defaultAgentId: "agent-1",
			status: "active",
			templates: { hello: "world" },
		});
		await client().channelConnections.delete("proj-1", "conn-1");
		await client().channelConnections.test("proj-1", "conn-1", {
			to: "+15551234567",
			message: "Test",
		});

		expect(list.connections?.[0]?.verify_token).toBe("[REDACTED]");
		expect(got.verify_token).toBe("[REDACTED]");
		expect(calls).toEqual([
			{
				method: "GET",
				url: `${BASE_URL}/api/v1/projects/proj-1/channel-connections`,
			},
			{
				method: "GET",
				url: `${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1`,
			},
			{
				method: "PATCH",
				url: `${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1`,
				body: {
					default_agent_id: "agent-1",
					status: "active",
					templates: { hello: "world" },
				},
			},
			{
				method: "DELETE",
				url: `${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1`,
			},
			{
				method: "POST",
				url: `${BASE_URL}/api/v1/projects/proj-1/channel-connections/conn-1/test`,
				body: { to: "+15551234567", message: "Test" },
			},
		]);
	});

	it("redacts channel connection secrets before JSON serialization", () => {
		const redacted = redactChannelConnectionSecrets({
			appSecret: "app-secret",
			access_token: "access-secret",
			verifyToken: "verify-secret",
			displayName: "Support",
		});

		expect(JSON.stringify(redacted)).toBe(
			'{"appSecret":"[REDACTED]","access_token":"[REDACTED]","verifyToken":"[REDACTED]","displayName":"Support"}',
		);
	});
});

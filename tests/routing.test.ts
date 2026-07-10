import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { type RoutingConfig, Sonzai } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("routing", () => {
	it("round-trips config through the typed resource", async () => {
		const config = {
			tiers: [],
			guide_agent: {
				agent_id: "guide-1",
				agent_name: "Guide",
				criteria: [],
				questions: [],
			},
			handoffs: [],
			channel_bindings: [],
		} as RoutingConfig;
		server.use(
			http.put(
				`${BASE_URL}/api/v1/projects/project-1/routing-config`,
				async ({ request }) => {
					expect(await request.json()).toEqual(config);
					return HttpResponse.json(config);
				},
			),
		);
		const client = new Sonzai({ apiKey: "test", baseUrl: BASE_URL });
		await expect(
			client.routing.putConfig("project-1", config),
		).resolves.toEqual(config);
	});

	it("overrides a permanent route", async () => {
		server.use(
			http.post(
				`${BASE_URL}/api/v1/projects/project-1/permanent-routes/user-1/override`,
				async ({ request }) => {
					expect(await request.json()).toEqual({ agent_id: "agent-2" });
					return HttpResponse.json({
						user_id: "user-1",
						override_agent_id: "agent-2",
						overridden: true,
					});
				},
			),
		);
		const client = new Sonzai({ apiKey: "test", baseUrl: BASE_URL });
		const route = await client.routing.overridePermanentRoute(
			"project-1",
			"user-1",
			"agent-2",
		);
		expect(route.overridden).toBe(true);
	});
});

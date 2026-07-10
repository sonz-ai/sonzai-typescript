import { createHmac } from "node:crypto";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
	type RuntimeUsageReport,
	Sonzai,
	canonicalRuntimeUsageReport,
	signRuntimeUsageReport,
} from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
	return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

function report(): RuntimeUsageReport {
	return {
		schema_version: 2,
		report_id: "r1",
		tenant_id: "t1",
		instance_id: "i1",
		period_start: "2026-07-10T08:00:00.000000123Z",
		period_end: "2026-07-10T08:01:00.000000123Z",
		heartbeat_at: "2026-07-10T08:01:00.000000123Z",
		counters: [
			{
				project_id: "p1",
				agent_id: "a1",
				provider: "openrouter",
				model: "m1",
				use_case: "chat",
				billing_mode: "byok",
				tokens_in: 10,
				tokens_out: 20,
				cache_read_tokens: 3,
				cache_creation_tokens: 0,
				turns: 1,
				unreported_turns: 0,
			},
			{
				project_id: "p1",
				agent_id: "a2",
				provider: "gemini",
				model: "m2",
				use_case: "chat",
				billing_mode: "standard",
				tokens_in: 30,
				tokens_out: 40,
				cache_read_tokens: 0,
				cache_creation_tokens: 2,
				turns: 1,
				unreported_turns: 0,
			},
		],
		signature: "",
	};
}

describe("runtime control plane", () => {
	it("downloads backend-agent artifacts without invoking an LLM endpoint", async () => {
		server.use(
			http.get(`${BASE_URL}/api/v1/runtime/backend-agent-artifacts`, () =>
				HttpResponse.json({
					artifacts: [{ slug: "lead_score", system: "score locally" }],
				}),
			),
		);
		const out = await client().runtime.backendAgentArtifacts();
		expect(out.artifacts[0]?.slug).toBe("lead_score");
	});

	it("fetches context without a platform chat call", async () => {
		server.use(
			http.post(
				`${BASE_URL}/api/v1/agents/agent%2Fone/context-bundle`,
				async ({ request }) => {
					expect(await request.json()).toEqual({
						user_id: "u1",
						session_id: "s1",
						current_message: "hello",
					});
					return HttpResponse.json({
						system_prompt_parts: ["system"],
						memory_context: {},
						tool_definitions: [],
						ttl: 300,
					});
				},
			),
		);
		const result = await client().runtime.contextBundle("agent/one", {
			user_id: "u1",
			session_id: "s1",
			current_message: "hello",
		});
		expect(result.ttl).toBe(300);
	});

	it("matches the shared canonical HMAC vector", async () => {
		const value = report();
		const expected = createHmac("sha256", "secret")
			.update(canonicalRuntimeUsageReport(value))
			.digest("hex");
		expect(await signRuntimeUsageReport(value, "secret")).toBe(expected);
		expect(expected).toBe(
			"4d209106751b9768c4e8afe82c544fbdfc43b83c3bb9fb42e79bb81765301308",
		);
	});

	it("submits signed usage with the metering header", async () => {
		const value = report();
		value.signature = await signRuntimeUsageReport(value, "secret");
		server.use(
			http.post(`${BASE_URL}/api/v1/usage/reports`, async ({ request }) => {
				expect(request.headers.get("x-sonzai-metering-signature")).toBe(
					value.signature,
				);
				expect((await request.json()) as RuntimeUsageReport).toEqual(value);
				return HttpResponse.json(
					{ accepted: true, report_id: "r1" },
					{ status: 202 },
				);
			}),
		);
		await expect(client().runtime.submitUsageReport(value)).resolves.toEqual({
			accepted: true,
			report_id: "r1",
		});
	});

	it("exposes a generic SDK request for newly added platform operations", async () => {
		server.use(
			http.get(`${BASE_URL}/api/v1/future-capability`, () =>
				HttpResponse.json({ available: true }),
			),
		);
		await expect(
			client().request("GET", "/api/v1/future-capability"),
		).resolves.toEqual({
			available: true,
		});
	});
});

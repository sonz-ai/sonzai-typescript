import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Sonzai } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
	return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

const assignment = {
	assignment_id: "assign-1",
	lead_ref: "lead-1",
	rep_user_id: "rep-1",
	state: "offered",
	policy: "load_balanced",
	offered_at: "2026-07-06T10:00:00Z",
	sla_expires_at: "2026-07-06T10:10:00Z",
};

describe("LeadAssignments.offer", () => {
	it("POSTs the offer body and decodes the result", async () => {
		let captured: Record<string, unknown> | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/lead-assignments/offer`,
				async ({ request }) => {
					captured = (await request.json()) as Record<string, unknown>;
					return HttpResponse.json({ assignment, deduplicated: false });
				},
			),
		);

		const res = await client().leadAssignments.offer({
			lead_ref: "lead-1",
			candidates: ["rep-1", "rep-2"],
			policy: "load_balanced",
			sla_seconds: 600,
		});

		expect(captured).toEqual({
			lead_ref: "lead-1",
			candidates: ["rep-1", "rep-2"],
			policy: "load_balanced",
			sla_seconds: 600,
		});
		expect(res.deduplicated).toBe(false);
		expect(res.assignment.assignment_id).toBe("assign-1");
		expect(res.assignment.rep_user_id).toBe("rep-1");
	});

	it("surfaces deduplicated offers", async () => {
		server.use(
			http.post(`${BASE_URL}/api/v1/lead-assignments/offer`, () =>
				HttpResponse.json({ assignment, deduplicated: true }),
			),
		);

		const res = await client().leadAssignments.offer({
			lead_ref: "lead-1",
			candidates: ["rep-1"],
		});

		expect(res.deduplicated).toBe(true);
	});
});

describe("LeadAssignments.list", () => {
	it("GETs with rep/state/limit filters", async () => {
		let captured: URL | null = null;
		server.use(
			http.get(`${BASE_URL}/api/v1/lead-assignments`, ({ request }) => {
				captured = new URL(request.url);
				return HttpResponse.json({ assignments: [assignment] });
			}),
		);

		const res = await client().leadAssignments.list({
			repUserId: "rep-1",
			state: "offered",
			limit: 10,
		});

		expect(captured!.searchParams.get("rep_user_id")).toBe("rep-1");
		expect(captured!.searchParams.get("state")).toBe("offered");
		expect(captured!.searchParams.get("limit")).toBe("10");
		expect(res.assignments).toHaveLength(1);
		expect(res.assignments[0]?.assignment_id).toBe("assign-1");
	});
});

describe("LeadAssignments.get", () => {
	it("GETs one assignment by id", async () => {
		server.use(
			http.get(`${BASE_URL}/api/v1/lead-assignments/assign-1`, () =>
				HttpResponse.json(assignment),
			),
		);

		const res = await client().leadAssignments.get("assign-1");

		expect(res.assignment_id).toBe("assign-1");
		expect(res.state).toBe("offered");
	});

	it("rejects an empty assignment id", async () => {
		await expect(client().leadAssignments.get("")).rejects.toThrow(
			"assignmentId must be a non-empty string",
		);
	});
});

describe("LeadAssignments transitions", () => {
	it.each([
		["claim", "claimed"],
		["release", "released"],
		["complete", "completed"],
	] as const)("POSTs %s and decodes the new state", async (action, state) => {
		let method: string | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/lead-assignments/assign-1/${action}`,
				({ request }) => {
					method = request.method;
					return HttpResponse.json({ ...assignment, state });
				},
			),
		);

		const res = await client().leadAssignments[action]("assign-1");

		expect(method).toBe("POST");
		expect(res.state).toBe(state);
	});
});

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { INGEST_EVENT_TYPES, Sonzai } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
	return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

describe("Ingest.sendEvent", () => {
	it("POSTs the DomainEvent body and decodes the result", async () => {
		let captured: Record<string, unknown> | null = null;
		server.use(
			http.post(`${BASE_URL}/api/v1/ingest/events`, async ({ request }) => {
				captured = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json({
					event_id: "11111111-1111-1111-1111-111111111111",
					type: "lead.created",
					duplicate: false,
				});
			}),
		);

		const res = await client().ingest.sendEvent({
			event_id: "11111111-1111-1111-1111-111111111111",
			type: INGEST_EVENT_TYPES.LEAD_CREATED,
			occurred_at: "2026-07-06T10:00:00Z",
			lead_ref: "lead-1",
			payload: { source: "salesforce" },
		});

		expect(captured).toEqual({
			event_id: "11111111-1111-1111-1111-111111111111",
			type: "lead.created",
			occurred_at: "2026-07-06T10:00:00Z",
			lead_ref: "lead-1",
			payload: { source: "salesforce" },
		});
		expect(res.duplicate).toBe(false);
		expect(res.type).toBe("lead.created");
	});

	it("surfaces duplicate replays", async () => {
		server.use(
			http.post(`${BASE_URL}/api/v1/ingest/events`, () =>
				HttpResponse.json({
					event_id: "e1",
					type: "outcome.recorded",
					duplicate: true,
				}),
			),
		);

		const res = await client().ingest.sendEvent({
			event_id: "e1",
			type: "outcome.recorded",
			occurred_at: "2026-07-06T10:00:00Z",
		});

		expect(res.duplicate).toBe(true);
	});
});

describe("Ingest.upsertContact", () => {
	it("POSTs the contact body and decodes the stored row", async () => {
		let captured: Record<string, unknown> | null = null;
		server.use(
			http.post(`${BASE_URL}/api/v1/ingest/contacts`, async ({ request }) => {
				captured = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json({
					id: "contact-1",
					contact_ref: "rep-1",
					kind: "rep",
					crm_owner_id: "sf-owner-1",
					created_at: "2026-07-06T10:00:00Z",
					updated_at: "2026-07-06T10:00:00Z",
				});
			}),
		);

		const res = await client().ingest.upsertContact({
			contact_ref: "rep-1",
			kind: "rep",
			crm_owner_id: "sf-owner-1",
		});

		expect(captured).toEqual({
			contact_ref: "rep-1",
			kind: "rep",
			crm_owner_id: "sf-owner-1",
		});
		expect(res.id).toBe("contact-1");
		expect(res.crm_owner_id).toBe("sf-owner-1");
	});
});

describe("Ingest.listEvents", () => {
	it("GETs with since/limit/cursor and decodes the page", async () => {
		let captured: URL | null = null;
		server.use(
			http.get(`${BASE_URL}/api/v1/ingest/events`, ({ request }) => {
				captured = new URL(request.url);
				return HttpResponse.json({
					events: [
						{
							event_id: "evt-1",
							type: "outcome.recorded",
							occurred_at: "2026-07-06T10:00:00Z",
							lead_ref: "lead-1",
							created_at: "2026-07-06T10:00:01Z",
						},
					],
					next_cursor: "cursor-2",
				});
			}),
		);

		const res = await client().ingest.listEvents({
			since: "2026-07-06T00:00:00Z",
			limit: 50,
		});

		expect(captured!.searchParams.get("since")).toBe("2026-07-06T00:00:00Z");
		expect(captured!.searchParams.get("limit")).toBe("50");
		expect(res.events).toHaveLength(1);
		expect(res.events[0]?.event_id).toBe("evt-1");
		expect(res.next_cursor).toBe("cursor-2");
	});

	it("passes the pagination cursor", async () => {
		let captured: URL | null = null;
		server.use(
			http.get(`${BASE_URL}/api/v1/ingest/events`, ({ request }) => {
				captured = new URL(request.url);
				return HttpResponse.json({ events: [] });
			}),
		);

		await client().ingest.listEvents({
			since: "2026-07-06T00:00:00Z",
			cursor: "cur-1",
		});

		expect(captured!.searchParams.get("cursor")).toBe("cur-1");
	});
});

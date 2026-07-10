import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Sonzai } from "../src/index.js";

const PLATFORM_BASE_URL = "https://api.test.sonz.ai";
const RUNTIME_BASE_URL = "https://runtime.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
	return new Sonzai({
		apiKey: "platform-key",
		baseUrl: PLATFORM_BASE_URL,
		runtimeBaseUrl: RUNTIME_BASE_URL,
		runtimeApiKey: "adapter-token",
		runtimeTenantId: "tenant-1",
	});
}

const contact = {
	id: "contact-1",
	tenant_id: "tenant-1",
	project_id: "proj-1",
	first_name: "Ada",
	last_name: "Lovelace",
	emails: [{ value: "ada@example.com", kind: "work" }],
	phones: [],
	lead_ref: "lead-1",
	owner_user_id: "owner-1",
	source: "salesforce",
	external_ref: "sf-contact-1",
	custom: { tier: "vip" },
	archived: false,
	created_at: "2026-07-10T00:00:00Z",
	updated_at: "2026-07-10T00:00:00Z",
};

describe("Crm", () => {
	it("bulk imports contacts against the runtime base URL with adapter auth", async () => {
		let captured: {
			url: string;
			auth: string | null;
			tenant: string | null;
			body: unknown;
		} | null = null;

		server.use(
			http.post(`${RUNTIME_BASE_URL}/api/rt/crm/import`, async ({ request }) => {
				captured = {
					url: request.url,
					auth: request.headers.get("authorization"),
					tenant: request.headers.get("x-sonzai-tenant-id"),
					body: await request.json(),
				};
				return HttpResponse.json({ imported: 1, contacts: [contact] });
			}),
		);

		const res = await client().crm.import({
			contacts: [
				{
					project_id: "proj-1",
					external_ref: "sf-contact-1",
					first_name: "Ada",
					last_name: "Lovelace",
					emails: [{ value: "ada@example.com", kind: "work" }],
					phones: [],
					lead_ref: "lead-1",
					owner_user_id: "owner-1",
					source: "salesforce",
					custom: { tier: "vip" },
				},
			],
		});

		expect(captured).not.toBeNull();
		expect(captured?.url).toBe(`${RUNTIME_BASE_URL}/api/rt/crm/import`);
		expect(captured?.auth).toBe("Bearer adapter-token");
		expect(captured?.tenant).toBe("tenant-1");
		expect(captured?.body).toEqual({
			contacts: [
				{
					project_id: "proj-1",
					external_ref: "sf-contact-1",
					first_name: "Ada",
					last_name: "Lovelace",
					emails: [{ value: "ada@example.com", kind: "work" }],
					phones: [],
					lead_ref: "lead-1",
					owner_user_id: "owner-1",
					source: "salesforce",
					custom: { tier: "vip" },
				},
			],
		});
		expect(res.imported).toBe(1);
		expect(res.contacts[0]?.external_ref).toBe("sf-contact-1");
	});

	it("provides importContacts as an alias for import", async () => {
		server.use(
			http.post(`${RUNTIME_BASE_URL}/api/rt/crm/import`, () => {
				return HttpResponse.json({ imported: 1, contacts: [contact] });
			}),
		);

		const res = await client().crm.importContacts({
			contacts: [{ external_ref: "sf-contact-1" }],
		});

		expect(res.imported).toBe(1);
	});

	it("fetches CRM events with cursor pagination and adapter auth", async () => {
		let captured:
			| { url: URL; auth: string | null; tenant: string | null }
			| null = null;
		server.use(
			http.get(`${RUNTIME_BASE_URL}/api/rt/crm/events`, ({ request }) => {
				captured = {
					url: new URL(request.url),
					auth: request.headers.get("authorization"),
					tenant: request.headers.get("x-sonzai-tenant-id"),
				};
				return HttpResponse.json({
					events: [
						{
							cursor: "1",
							tenant_id: "tenant-1",
							event: "crm.contact.upserted",
							entity_id: "contact-1",
							entity_type: "contact",
							payload: { contact },
							at: "2026-07-10T00:00:01Z",
						},
					],
					next_cursor: "2",
				});
			}),
		);

		const res = await client().crm.events({ cursor: "1", limit: 25 });

		expect(captured?.url.searchParams.get("cursor")).toBe("1");
		expect(captured?.url.searchParams.get("limit")).toBe("25");
		expect(captured?.auth).toBe("Bearer adapter-token");
		expect(captured?.tenant).toBe("tenant-1");
		expect(res.events[0]?.event).toBe("crm.contact.upserted");
		expect(res.next_cursor).toBe("2");
	});

	it("iterates CRM event pages until the runtime repeats the exhausted cursor", async () => {
		const cursors: Array<string | null> = [];
		server.use(
			http.get(`${RUNTIME_BASE_URL}/api/rt/crm/events`, ({ request }) => {
				const url = new URL(request.url);
				cursors.push(url.searchParams.get("cursor"));
				if (url.searchParams.get("cursor") === "1") {
					return HttpResponse.json({
						events: [],
						next_cursor: "1",
					});
				}
				return HttpResponse.json({
					events: [
						{
							cursor: "1",
							event: "crm.contact.upserted",
							payload: {},
							at: "2026-07-10T00:00:01Z",
						},
					],
					next_cursor: "1",
				});
			}),
		);

		const events = [];
		for await (const event of client().crm.iterateEvents({ limit: 1 })) {
			events.push(event);
		}

		expect(cursors).toEqual([null, "1"]);
		expect(events.map((event) => event.event)).toEqual([
			"crm.contact.upserted",
		]);
	});

	it("fails clearly when runtimeBaseUrl is not configured", async () => {
		const c = new Sonzai({
			apiKey: "platform-key",
			baseUrl: PLATFORM_BASE_URL,
			runtimeApiKey: "adapter-token",
		});

		await expect(
			c.crm.import({ contacts: [{ external_ref: "sf-contact-1" }] }),
		).rejects.toThrow("runtimeBaseUrl and runtimeApiKey");
	});

	it("requires a separate runtime adapter token", async () => {
		const c = new Sonzai({
			apiKey: "platform-key",
			baseUrl: PLATFORM_BASE_URL,
			runtimeBaseUrl: RUNTIME_BASE_URL,
		});

		await expect(c.crm.events()).rejects.toThrow(
			"runtimeBaseUrl and runtimeApiKey (ADAPTER_TOKEN) must be provided",
		);
	});
});

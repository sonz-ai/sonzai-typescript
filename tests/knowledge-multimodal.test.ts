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

type Captured = {
	method: string;
	url: string;
	query: Record<string, string>;
	body: Record<string, unknown> | null;
};

function captureQuery(url: string): Record<string, string> {
	const q: Record<string, string> = {};
	for (const [k, v] of new URL(url).searchParams) q[k] = v;
	return q;
}

const sampleFact = {
	fact_id: "f-1",
	from_node_id: "n-from",
	to_node_id: "n-to",
	relation_type: "priced_at",
	properties: { currency: "PHP" },
	source_document_id: "doc-9",
	source_page: 4,
	source_snippet: "Unit 12A is priced at PHP 8,500,000.",
	extraction_confidence: 0.92,
	effective_date: "2026-01-01",
	version: 3,
	is_active: true,
	created_at: "2026-01-02T00:00:00Z",
};

// ---------------------------------------------------------------------------
// patchDocumentClassification
// ---------------------------------------------------------------------------

describe("Knowledge.patchDocumentClassification", () => {
	it("PATCHes .../documents/{id}/classification with root_entity body", async () => {
		let captured: Captured | null = null;
		server.use(
			http.patch(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/documents/:documentId/classification`,
				async ({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/documents/${params.documentId}/classification`,
						query: captureQuery(request.url),
						body: (await request.json()) as Record<string, unknown>,
					};
					return HttpResponse.json({
						status: "extracting",
						document_id: "doc-9",
					});
				},
			),
		);

		const res = await client().knowledge.patchDocumentClassification(
			"proj-1",
			"doc-9",
			{ root_entity: { type: "Property", key: { unit: "12A" } } },
		);

		expect(captured).not.toBeNull();
		expect(captured!.method).toBe("PATCH");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/documents/doc-9/classification",
		);
		expect(captured!.body).toEqual({
			root_entity: { type: "Property", key: { unit: "12A" } },
		});
		expect(res.status).toBe("extracting");
		expect(res.document_id).toBe("doc-9");
	});
});

// ---------------------------------------------------------------------------
// reingestDocument
// ---------------------------------------------------------------------------

describe("Knowledge.reingestDocument", () => {
	it("POSTs to .../documents/{id}/reingest and decodes the mode", async () => {
		let captured: Captured | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/documents/:documentId/reingest`,
				async ({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/documents/${params.documentId}/reingest`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({
						status: "queued",
						document_id: "doc-9",
						mode: "multimodal",
					});
				},
			),
		);

		const res = await client().knowledge.reingestDocument("proj-1", "doc-9");

		expect(captured!.method).toBe("POST");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/documents/doc-9/reingest",
		);
		expect(res.status).toBe("queued");
		expect(res.mode).toBe("multimodal");
		expect(res.document_id).toBe("doc-9");
	});
});

// ---------------------------------------------------------------------------
// getDocumentCost
// ---------------------------------------------------------------------------

describe("Knowledge.getDocumentCost", () => {
	it("GETs .../documents/{id}/cost and decodes the breakdown", async () => {
		let captured: Captured | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/documents/:documentId/cost`,
				({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/documents/${params.documentId}/cost`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({
						document_id: "doc-9",
						total_cost_usd: 0.42,
						document_ai_rows: [
							{ operation: "ocr", model: "docai", cost_usd: 0.12, pages: 4 },
						],
						llm_rows: [
							{ operation: "extract", model: "gemini", cost_usd: 0.3 },
						],
					});
				},
			),
		);

		const res = await client().knowledge.getDocumentCost("proj-1", "doc-9");

		expect(captured!.method).toBe("GET");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/documents/doc-9/cost",
		);
		expect(res.total_cost_usd).toBe(0.42);
		expect(res.document_ai_rows[0]?.operation).toBe("ocr");
		expect(res.document_ai_rows[0]?.pages).toBe(4);
		expect(res.llm_rows[0]?.model).toBe("gemini");
	});
});

// ---------------------------------------------------------------------------
// listFacts
// ---------------------------------------------------------------------------

describe("Knowledge.listFacts", () => {
	it("GETs .../knowledge/facts with limit + page_token query params", async () => {
		let captured: Captured | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/facts`,
				({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/facts`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({
						facts: [sampleFact],
						next_page_token: "tok-2",
					});
				},
			),
		);

		const res = await client().knowledge.listFacts("proj-1", {
			limit: 50,
			pageToken: "tok-1",
		});

		expect(captured!.method).toBe("GET");
		expect(captured!.url).toBe("/api/v1/projects/proj-1/knowledge/facts");
		expect(captured!.query).toEqual({ limit: "50", page_token: "tok-1" });
		expect(res.facts[0]?.fact_id).toBe("f-1");
		expect(res.facts[0]?.source_page).toBe(4);
		expect(res.next_page_token).toBe("tok-2");
	});

	it("omits query params when no options are given", async () => {
		let query: Record<string, string> = {};
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/facts`,
				({ request }) => {
					query = captureQuery(request.url);
					return HttpResponse.json({ facts: [] });
				},
			),
		);

		await client().knowledge.listFacts("proj-1");
		expect(query).toEqual({});
	});
});

// ---------------------------------------------------------------------------
// getActiveFact
// ---------------------------------------------------------------------------

describe("Knowledge.getActiveFact", () => {
	it("GETs .../facts/active with the tuple query params and unwraps fact", async () => {
		let captured: Captured | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/facts/active`,
				({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/facts/active`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({ fact: sampleFact });
				},
			),
		);

		const res = await client().knowledge.getActiveFact(
			"proj-1",
			"n-from",
			"n-to",
			"priced_at",
		);

		expect(captured!.method).toBe("GET");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/facts/active",
		);
		expect(captured!.query).toEqual({
			from_node_id: "n-from",
			to_node_id: "n-to",
			relation_type: "priced_at",
		});
		expect(res?.fact_id).toBe("f-1");
	});

	it("returns null when the server reports no active fact", async () => {
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/facts/active`,
				() => HttpResponse.json({ fact: null }),
			),
		);

		const res = await client().knowledge.getActiveFact(
			"proj-1",
			"a",
			"b",
			"rel",
		);
		expect(res).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// getFactHistory
// ---------------------------------------------------------------------------

describe("Knowledge.getFactHistory", () => {
	it("GETs .../facts/history with the tuple query params", async () => {
		let captured: Captured | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/facts/history`,
				({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/facts/history`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({
						versions: [
							sampleFact,
							{ ...sampleFact, version: 2, is_active: false },
						],
					});
				},
			),
		);

		const res = await client().knowledge.getFactHistory(
			"proj-1",
			"n-from",
			"n-to",
			"priced_at",
		);

		expect(captured!.method).toBe("GET");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/facts/history",
		);
		expect(captured!.query).toEqual({
			from_node_id: "n-from",
			to_node_id: "n-to",
			relation_type: "priced_at",
		});
		expect(res.versions).toHaveLength(2);
		expect(res.versions[1]?.version).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// getEntity
// ---------------------------------------------------------------------------

describe("Knowledge.getEntity", () => {
	it("GETs .../entities/{type}/{json-key} and decodes incoming/outgoing facts", async () => {
		let method = "";
		let rawUrl = "";
		let decodedKeyParam = "";
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/entities/:entityType/:entityKey`,
				({ request, params }) => {
					method = request.method;
					rawUrl = request.url; // carries the still-encoded path segment
					decodedKeyParam = String(params.entityKey); // MSW decodes path params
					return HttpResponse.json({
						entity_type: "Property",
						entity_key: { unit: "12A" },
						entity_node_id: "node-12a",
						outgoing_facts: [sampleFact],
						incoming_facts: [],
					});
				},
			),
		);

		const res = await client().knowledge.getEntity("proj-1", "Property", {
			unit: "12A",
		});

		expect(method).toBe("GET");
		// The entity key is JSON-encoded then URL-encoded into the path segment;
		// the wire URL must carry the percent-encoded JSON.
		const encodedKey = encodeURIComponent(JSON.stringify({ unit: "12A" }));
		expect(rawUrl).toBe(
			`${BASE_URL}/api/v1/projects/proj-1/knowledge/entities/Property/${encodedKey}`,
		);
		// ...and the server decodes it back to the original JSON.
		expect(decodedKeyParam).toBe(JSON.stringify({ unit: "12A" }));
		expect(res.entity_node_id).toBe("node-12a");
		expect(res.outgoing_facts[0]?.fact_id).toBe("f-1");
		expect(res.incoming_facts).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// traverse
// ---------------------------------------------------------------------------

describe("Knowledge.traverse", () => {
	it("GETs .../traverse with from_type / from_key / direction / max_depth", async () => {
		let captured: Captured | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/traverse`,
				({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/traverse`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({
						facts: [{ depth: 1, fact: sampleFact }],
					});
				},
			),
		);

		const res = await client().knowledge.traverse(
			"proj-1",
			{ type: "Property", key: { unit: "12A" } },
			"located_in",
			{ direction: "both", maxDepth: 2 },
		);

		expect(captured!.method).toBe("GET");
		expect(captured!.url).toBe("/api/v1/projects/proj-1/knowledge/traverse");
		expect(captured!.query).toEqual({
			from_type: "Property",
			from_key: JSON.stringify({ unit: "12A" }),
			relation_type: "located_in",
			direction: "both",
			max_depth: "2",
		});
		expect(res.facts[0]?.depth).toBe(1);
		expect(res.facts[0]?.fact.fact_id).toBe("f-1");
	});

	it("omits direction/max_depth when not provided", async () => {
		let query: Record<string, string> = {};
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/traverse`,
				({ request }) => {
					query = captureQuery(request.url);
					return HttpResponse.json({ facts: [] });
				},
			),
		);

		await client().knowledge.traverse(
			"proj-1",
			{ type: "Property", key: { unit: "12A" } },
			"located_in",
		);

		expect(query).toEqual({
			from_type: "Property",
			from_key: JSON.stringify({ unit: "12A" }),
			relation_type: "located_in",
		});
	});
});

// ---------------------------------------------------------------------------
// compare
// ---------------------------------------------------------------------------

describe("Knowledge.compare", () => {
	it("POSTs .../compare with the full request body and decodes rows", async () => {
		let captured: Captured | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/compare`,
				async ({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/compare`,
						query: captureQuery(request.url),
						body: (await request.json()) as Record<string, unknown>,
					};
					return HttpResponse.json({
						rows: [
							{
								entity: { type: "Property", key: { unit: "12A" } },
								value: 8500000,
								fact: sampleFact,
								missing: false,
							},
							{
								entity: { type: "Property", key: { unit: "12B" } },
								missing: true,
								missing_reason: "no_fact",
							},
						],
					});
				},
			),
		);

		const res = await client().knowledge.compare("proj-1", {
			entities: [
				{ type: "Property", key: { unit: "12A" } },
				{ type: "Property", key: { unit: "12B" } },
			],
			via_relation: "priced_at",
			target_entity: { type: "PriceList", key: { id: "pl-1" } },
			property_path: "amount",
		});

		expect(captured!.method).toBe("POST");
		expect(captured!.url).toBe("/api/v1/projects/proj-1/knowledge/compare");
		expect(captured!.body).toEqual({
			entities: [
				{ type: "Property", key: { unit: "12A" } },
				{ type: "Property", key: { unit: "12B" } },
			],
			via_relation: "priced_at",
			target_entity: { type: "PriceList", key: { id: "pl-1" } },
			property_path: "amount",
		});
		expect(res.rows).toHaveLength(2);
		expect(res.rows[0]?.value).toBe(8500000);
		expect(res.rows[1]?.missing).toBe(true);
		expect(res.rows[1]?.missing_reason).toBe("no_fact");
	});
});

// ---------------------------------------------------------------------------
// listMultimodalSchemas
// ---------------------------------------------------------------------------

const sampleSchema = {
	project_id: "proj-1",
	schema_version: 2,
	status: "active",
	created_at: "2026-01-01T00:00:00Z",
	created_by: "user-1",
	vertical_template: "real_estate",
	config: { classify_model: "gemini", classify_auto_threshold: 0.8 },
	doc_types: [{ type: "brochure", root_entity_type: "Property" }],
	entity_types: [
		{ type: "Property", key_fields: ["unit"], is_root_candidate: true },
	],
	relationship_types: [
		{
			type: "priced_at",
			from: "Property",
			to: "PriceList",
			supersession_identity: ["unit"],
		},
	],
};

describe("Knowledge.listMultimodalSchemas", () => {
	it("GETs .../multimodal-schemas and decodes the versions", async () => {
		let captured: Captured | null = null;
		server.use(
			http.get(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/multimodal-schemas`,
				({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/multimodal-schemas`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({ schemas: [sampleSchema] });
				},
			),
		);

		const res = await client().knowledge.listMultimodalSchemas("proj-1");

		expect(captured!.method).toBe("GET");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/multimodal-schemas",
		);
		expect(res.schemas[0]?.schema_version).toBe(2);
		expect(res.schemas[0]?.entity_types[0]?.type).toBe("Property");
	});
});

// ---------------------------------------------------------------------------
// createMultimodalSchema
// ---------------------------------------------------------------------------

describe("Knowledge.createMultimodalSchema", () => {
	it("POSTs the schema body to .../multimodal-schemas and decodes the result", async () => {
		let captured: Captured | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/multimodal-schemas`,
				async ({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/multimodal-schemas`,
						query: captureQuery(request.url),
						body: (await request.json()) as Record<string, unknown>,
					};
					return HttpResponse.json({
						schema: { ...sampleSchema, status: "draft", schema_version: 3 },
					});
				},
			),
		);

		const res = await client().knowledge.createMultimodalSchema("proj-1", {
			...sampleSchema,
			schema_version: 3,
			status: "draft",
		});

		expect(captured!.method).toBe("POST");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/multimodal-schemas",
		);
		expect(captured!.body).toEqual({
			...sampleSchema,
			schema_version: 3,
			status: "draft",
		});
		expect(res.schema.schema_version).toBe(3);
		expect(res.schema.status).toBe("draft");
	});
});

// ---------------------------------------------------------------------------
// activateMultimodalSchema
// ---------------------------------------------------------------------------

describe("Knowledge.activateMultimodalSchema", () => {
	it("POSTs to .../multimodal-schemas/{version}/activate", async () => {
		let captured: Captured | null = null;
		server.use(
			http.post(
				`${BASE_URL}/api/v1/projects/:projectId/knowledge/multimodal-schemas/:version/activate`,
				async ({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/projects/${params.projectId}/knowledge/multimodal-schemas/${params.version}/activate`,
						query: captureQuery(request.url),
						body: null,
					};
					return HttpResponse.json({ active_version: 3, status: "active" });
				},
			),
		);

		const res = await client().knowledge.activateMultimodalSchema("proj-1", 3);

		expect(captured!.method).toBe("POST");
		expect(captured!.url).toBe(
			"/api/v1/projects/proj-1/knowledge/multimodal-schemas/3/activate",
		);
		expect(res.active_version).toBe(3);
		expect(res.status).toBe("active");
	});
});

// ---------------------------------------------------------------------------
// agents.updatePersonality
// ---------------------------------------------------------------------------

describe("Agents.updatePersonality", () => {
	it("PATCHes /agents/{agentId}/personality with big5 + dimensions", async () => {
		let captured: Captured | null = null;
		server.use(
			http.patch(
				`${BASE_URL}/api/v1/agents/:agentId/personality`,
				async ({ request, params }) => {
					captured = {
						method: request.method,
						url: `/api/v1/agents/${params.agentId}/personality`,
						query: captureQuery(request.url),
						body: (await request.json()) as Record<string, unknown>,
					};
					return HttpResponse.json({ success: true });
				},
			),
		);

		const res = await client().agents.updatePersonality("agent-7", {
			big5: {
				openness: 75,
				conscientiousness: 85,
				extraversion: 65,
				agreeableness: 80,
				neuroticism: 20,
			},
		});

		expect(captured!.method).toBe("PATCH");
		expect(captured!.url).toBe("/api/v1/agents/agent-7/personality");
		expect(captured!.body).toEqual({
			big5: {
				openness: 75,
				conscientiousness: 85,
				extraversion: 65,
				agreeableness: 80,
				neuroticism: 20,
			},
		});
		expect(res.success).toBe(true);
	});

	it("rejects an empty agentId", async () => {
		await expect(
			client().agents.updatePersonality("", { big5: undefined }),
		).rejects.toThrow(/agentId/);
	});
});

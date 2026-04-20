import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Sonzai, KBScope, type KBScopeMode } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

describe("Knowledge.createOrgNode", () => {
  it("POSTs to /tenants/{id}/knowledge/org-nodes", async () => {
    let seenPath = "";
    let seenBody: unknown;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/tenants/:tenantId/knowledge/org-nodes`,
        async ({ request, params }) => {
          seenPath = `/api/v1/tenants/${params.tenantId}/knowledge/org-nodes`;
          seenBody = await request.json();
          return HttpResponse.json({
            project_id: "",
            node_id: "n1",
            node_type: "policy",
            label: "Refund",
            properties: {},
            source_type: "api",
            version: 1,
            is_active: true,
            confidence: 1.0,
          });
        },
      ),
    );

    const out = await client().knowledge.createOrgNode("tenant-abc", {
      node_type: "policy",
      label: "Refund",
      properties: { description: "default" },
    });

    expect(seenPath).toBe("/api/v1/tenants/tenant-abc/knowledge/org-nodes");
    expect(seenBody).toEqual({
      node_type: "policy",
      label: "Refund",
      properties: { description: "default" },
    });
    expect(out.node_id).toBe("n1");
  });
});

describe("Knowledge.promoteNodeToOrg", () => {
  it("POSTs with project + node path and tenant_id body", async () => {
    let seenPath = "";
    let seenBody: unknown;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/projects/:projectId/knowledge/nodes/:nodeId/promote-to-org`,
        async ({ request, params }) => {
          seenPath = `/api/v1/projects/${params.projectId}/knowledge/nodes/${params.nodeId}/promote-to-org`;
          seenBody = await request.json();
          return HttpResponse.json({
            project_id: "",
            node_id: "org-n1",
            node_type: "policy",
            label: "Privacy",
            properties: {},
            source_type: "promotion",
            version: 1,
            is_active: true,
            confidence: 1.0,
            scope_type: "organization",
            relevance: 1.0,
          });
        },
      ),
    );

    const out = await client().knowledge.promoteNodeToOrg("proj-a", "p1", "tenant-abc");

    expect(seenPath).toBe(
      "/api/v1/projects/proj-a/knowledge/nodes/p1/promote-to-org",
    );
    expect(seenBody).toEqual({ tenant_id: "tenant-abc" });
    expect(out.scope_type).toBe("organization");
    expect(out.node_id).toBe("org-n1");
  });
});

describe("KBScope constants", () => {
  it("have stable wire values for cross-SDK compatibility", () => {
    // Runtime values must match the Go + Python SDKs and the server enum.
    expect(KBScope.ProjectOnly).toBe("project_only");
    expect(KBScope.OrgOnly).toBe("org_only");
    expect(KBScope.Cascade).toBe("cascade");
    expect(KBScope.Union).toBe("union");
  });

  it("fits the KBScopeMode union", () => {
    // Compile-time shape check — if KBScopeMode drifts, this fails tsc.
    const mode: KBScopeMode = KBScope.Cascade;
    expect(mode).toBe("cascade");
  });
});

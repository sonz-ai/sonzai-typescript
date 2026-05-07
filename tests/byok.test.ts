import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Sonzai } from "../src/index.js";

const BASE_URL = "https://api.test.sonz.ai";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return new Sonzai({ apiKey: "test-key", baseUrl: BASE_URL });
}

const sampleKey = {
  provider: "openai",
  api_key_prefix: "sk-abc",
  is_active: true,
  health_status: "healthy",
  updated_at: "2026-05-07T00:00:00Z",
};

describe("BYOK", () => {
  it("lists keys for a project (GET .../byok-keys)", async () => {
    let captured: { method: string; url: string } | null = null;
    server.use(
      http.get(
        `${BASE_URL}/api/v1/projects/proj-1/byok-keys`,
        ({ request }) => {
          captured = { method: request.method, url: request.url };
          return HttpResponse.json({ keys: [sampleKey] });
        },
      ),
    );

    const res = await client().byok.list("proj-1");

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("GET");
    expect(captured!.url).toBe(`${BASE_URL}/api/v1/projects/proj-1/byok-keys`);
    expect(res).toHaveLength(1);
    expect(res[0]?.provider).toBe("openai");
    expect(res[0]?.api_key_prefix).toBe("sk-abc");
  });

  it("returns [] when keys is null", async () => {
    server.use(
      http.get(
        `${BASE_URL}/api/v1/projects/proj-1/byok-keys`,
        () => HttpResponse.json({ keys: null }),
      ),
    );

    const res = await client().byok.list("proj-1");
    expect(res).toEqual([]);
  });

  it("sets a key (PUT .../byok-keys/{provider}, body: {api_key})", async () => {
    let captured: {
      method: string;
      url: string;
      body: Record<string, unknown>;
    } | null = null;
    server.use(
      http.put(
        `${BASE_URL}/api/v1/projects/proj-1/byok-keys/openai`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json(sampleKey);
        },
      ),
    );

    const res = await client().byok.set("proj-1", "openai", "sk-secret-abc");

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("PUT");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/projects/proj-1/byok-keys/openai`,
    );
    expect(captured!.body).toEqual({ api_key: "sk-secret-abc" });
    expect(res.provider).toBe("openai");
  });

  it("toggles active state (PATCH .../byok-keys/{provider}, body: {is_active})", async () => {
    let captured: {
      method: string;
      url: string;
      body: Record<string, unknown>;
    } | null = null;
    server.use(
      http.patch(
        `${BASE_URL}/api/v1/projects/proj-1/byok-keys/gemini`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({ ...sampleKey, provider: "gemini", is_active: false });
        },
      ),
    );

    const res = await client().byok.setActive("proj-1", "gemini", false);

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("PATCH");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/projects/proj-1/byok-keys/gemini`,
    );
    expect(captured!.body).toEqual({ is_active: false });
    expect(res.is_active).toBe(false);
    expect(res.provider).toBe("gemini");
  });

  it("deletes a key (DELETE .../byok-keys/{provider})", async () => {
    let captured: { method: string; url: string } | null = null;
    server.use(
      http.delete(
        `${BASE_URL}/api/v1/projects/proj-1/byok-keys/xai`,
        ({ request }) => {
          captured = { method: request.method, url: request.url };
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    await client().byok.delete("proj-1", "xai");

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("DELETE");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/projects/proj-1/byok-keys/xai`,
    );
  });

  it("tests a key (POST .../byok-keys/{provider}/test — slash, NOT colon)", async () => {
    let captured: { method: string; url: string } | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/projects/proj-1/byok-keys/openrouter/test`,
        ({ request }) => {
          captured = { method: request.method, url: request.url };
          return HttpResponse.json({
            ...sampleKey,
            provider: "openrouter",
            health_status: "healthy",
          });
        },
      ),
    );

    const res = await client().byok.test("proj-1", "openrouter");

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/projects/proj-1/byok-keys/openrouter/test`,
    );
    // Sanity-check we didn't accidentally use colon syntax.
    expect(captured!.url).not.toContain(":test");
    expect(res.provider).toBe("openrouter");
    expect(res.health_status).toBe("healthy");
  });
});

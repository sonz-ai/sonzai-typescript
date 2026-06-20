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

type Captured = {
  method: string;
  url: string;
  body: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// 1. scoring/train  (LONG-RUNNING)
// ---------------------------------------------------------------------------

describe("Ml.trainScoring", () => {
  const sample = {
    auc: 0.91,
    logloss: 0.32,
    brier: 0.18,
    brier_uncalibrated: 0.21,
    brier_baseline: 0.25,
    ece: 0.04,
    n: 1000,
    importances: [
      { name: "budget", gain: 12.4 },
      { name: "region", gain: 3.1 },
    ],
    best_params: { depth: 6, lr: 0.03 },
    calibration_method: "isotonic",
    trials: 40,
    model_version: 7,
  };

  it("POSTs to .../scoring/train and decodes the metrics", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/scoring/train`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json(sample);
        },
      ),
    );

    const res = await client().ml.trainScoring("lead_score", {
      rows: [
        { features: { budget: 5_000_000, region: "PH" }, label: 1 },
        { features: { budget: 800_000, region: "PH" }, label: 0 },
      ],
      optimize_budget: 40,
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/scoring/train`,
    );
    expect(captured!.body).toEqual({
      rows: [
        { features: { budget: 5_000_000, region: "PH" }, label: 1 },
        { features: { budget: 800_000, region: "PH" }, label: 0 },
      ],
      optimize_budget: 40,
    });
    expect(res.auc).toBe(0.91);
    expect(res.model_version).toBe(7);
    expect(res.importances[0]?.name).toBe("budget");
    expect(res.importances[0]?.gain).toBe(12.4);
    expect(res.best_params).toEqual({ depth: 6, lr: 0.03 });
    expect(res.calibration_method).toBe("isotonic");
  });

  it("omits optimize_budget when not provided", async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/churn/scoring/train`,
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(sample);
        },
      ),
    );

    await client().ml.trainScoring("churn", {
      rows: [{ features: { x: 1 }, label: 0 }],
    });

    expect(body).toEqual({ rows: [{ features: { x: 1 }, label: 0 }] });
  });

  it("rejects an empty useCase", async () => {
    await expect(
      client().ml.trainScoring("", { rows: [] }),
    ).rejects.toThrow("useCase must be a non-empty string");
  });
});

// ---------------------------------------------------------------------------
// 2. scoring/predict
// ---------------------------------------------------------------------------

describe("Ml.predictScore", () => {
  it("POSTs to .../scoring/predict and decodes the prediction", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/scoring/predict`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({
            score: 0.82,
            raw: 1.51,
            model_version: 7,
            served_from: "live",
            calibration_method: "isotonic",
          });
        },
      ),
    );

    const res = await client().ml.predictScore("lead_score", {
      features: { budget: 3_000_000, region: "PH" },
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/scoring/predict`,
    );
    expect(captured!.body).toEqual({
      features: { budget: 3_000_000, region: "PH" },
    });
    expect(res.score).toBe(0.82);
    expect(res.raw).toBe(1.51);
    expect(res.model_version).toBe(7);
    expect(res.served_from).toBe("live");
    expect(res.calibration_method).toBe("isotonic");
  });

  it("rejects an empty useCase", async () => {
    await expect(
      client().ml.predictScore("", { features: {} }),
    ).rejects.toThrow("useCase must be a non-empty string");
  });
});

// ---------------------------------------------------------------------------
// 3. nba/decide
// ---------------------------------------------------------------------------

describe("Ml.decideNba", () => {
  it("POSTs to .../nba/decide and decodes the chosen action + slate", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/nba/decide`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({
            action_id: "call",
            propensity: 0.7,
            scores: [
              { action_id: "call", score: 0.9, propensity: 0.7 },
              { action_id: "sms", score: 0.4, propensity: 0.3 },
            ],
            explore: false,
            model_n: 1234,
          });
        },
      ),
    );

    const res = await client().ml.decideNba("lead_score", {
      context: { score: 0.82, band: "hot" },
      actions: [
        { id: "call", features: { cost: 5 } },
        { id: "sms", features: { cost: 1 } },
      ],
      explore: false,
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/nba/decide`,
    );
    expect(captured!.body).toEqual({
      context: { score: 0.82, band: "hot" },
      actions: [
        { id: "call", features: { cost: 5 } },
        { id: "sms", features: { cost: 1 } },
      ],
      explore: false,
    });
    expect(res.action_id).toBe("call");
    expect(res.propensity).toBe(0.7);
    expect(res.scores).toHaveLength(2);
    expect(res.scores[1]?.action_id).toBe("sms");
    expect(res.explore).toBe(false);
    expect(res.model_n).toBe(1234);
  });

  it("rejects an empty useCase", async () => {
    await expect(
      client().ml.decideNba("", { context: {}, actions: [] }),
    ).rejects.toThrow("useCase must be a non-empty string");
  });
});

// ---------------------------------------------------------------------------
// 4. nba/learn
// ---------------------------------------------------------------------------

describe("Ml.learnNba", () => {
  it("POSTs to .../nba/learn and decodes the ack", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/nba/learn`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({ ok: true, n: 42 });
        },
      ),
    );

    const res = await client().ml.learnNba("lead_score", {
      context: { score: 0.82 },
      action_id: "call",
      action_features: { cost: 5 },
      propensity: 0.7,
      reward: 1,
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/nba/learn`,
    );
    expect(captured!.body).toEqual({
      context: { score: 0.82 },
      action_id: "call",
      action_features: { cost: 5 },
      propensity: 0.7,
      reward: 1,
    });
    expect(res.ok).toBe(true);
    expect(res.n).toBe(42);
  });

  it("rejects an empty useCase", async () => {
    await expect(
      client().ml.learnNba("", { action_id: "call", reward: 1 }),
    ).rejects.toThrow("useCase must be a non-empty string");
  });
});

// ---------------------------------------------------------------------------
// 5. ope/evaluate
// ---------------------------------------------------------------------------

describe("Ml.evaluateOpe", () => {
  it("POSTs to .../ope/evaluate and decodes the estimates", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/ope/evaluate`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({
            ips: 0.55,
            snips: 0.57,
            dr: 0.58,
            ci_low: 0.5,
            ci_high: 0.66,
            n: 500,
            ess: 120.5,
            estimator_ci: "dr",
          });
        },
      ),
    );

    const res = await client().ml.evaluateOpe("lead_score", {
      logged: [
        {
          context: { score: 0.8 },
          action_id: "call",
          propensity: 0.7,
          reward: 1,
        },
      ],
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/ope/evaluate`,
    );
    expect(captured!.body).toEqual({
      logged: [
        {
          context: { score: 0.8 },
          action_id: "call",
          propensity: 0.7,
          reward: 1,
        },
      ],
    });
    expect(res.ips).toBe(0.55);
    expect(res.snips).toBe(0.57);
    expect(res.dr).toBe(0.58);
    expect(res.ci_low).toBe(0.5);
    expect(res.ci_high).toBe(0.66);
    expect(res.n).toBe(500);
    expect(res.ess).toBe(120.5);
    expect(res.estimator_ci).toBe("dr");
  });

  it("rejects an empty useCase", async () => {
    await expect(
      client().ml.evaluateOpe("", { logged: [] }),
    ).rejects.toThrow("useCase must be a non-empty string");
  });
});

// ---------------------------------------------------------------------------
// 6. simulate-rounds  (LONG-RUNNING)
// ---------------------------------------------------------------------------

describe("Ml.simulateRounds", () => {
  const sample = {
    scenario: "real_estate",
    action_labels: { call: "Phone call", sms: "Send SMS" },
    series: [
      {
        round: 1,
        n: 100,
        auc: 0.7,
        nba_value: 0.4,
        nba_reward: 0.41,
        ope_dr: 0.42,
        ci_low: 0.3,
        ci_high: 0.5,
      },
      {
        round: 2,
        n: 200,
        auc: 0.85,
        nba_value: 0.6,
        nba_reward: 0.62,
        ope_dr: 0.63,
        ci_low: 0.55,
        ci_high: 0.71,
      },
    ],
    model: {
      auc: 0.85,
      brier: 0.15,
      ece: 0.03,
      n: 200,
      calibration_method: "isotonic",
      best_params: { depth: 5 },
      importances: [{ name: "budget", gain: 9.9 }],
    },
    policy: [
      {
        segment: "hot",
        recommended_action: "call",
        recommended_label: "Phone call",
        scores: [
          { action_id: "call", score: 0.9, label: "Phone call" },
          { action_id: "sms", score: 0.4, label: "Send SMS" },
        ],
      },
    ],
    ope: { dr: 0.63, ci_low: 0.55, ci_high: 0.71 },
  };

  it("POSTs to .../simulate-rounds and decodes the curve + model + policy", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/simulate-rounds`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json(sample);
        },
      ),
    );

    const res = await client().ml.simulateRounds("lead_score", {
      scenario: "real_estate",
      rounds: 2,
      seed: 7,
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/simulate-rounds`,
    );
    expect(captured!.body).toEqual({
      scenario: "real_estate",
      rounds: 2,
      seed: 7,
    });
    expect(res.scenario).toBe("real_estate");
    expect(res.action_labels).toEqual({ call: "Phone call", sms: "Send SMS" });
    expect(res.series).toHaveLength(2);
    expect(res.series[1]?.round).toBe(2);
    expect(res.series[1]?.auc).toBe(0.85);
    expect(res.model?.auc).toBe(0.85);
    expect(res.model?.importances[0]?.name).toBe("budget");
    expect(res.policy[0]?.recommended_action).toBe("call");
    expect(res.policy[0]?.scores).toHaveLength(2);
    expect(res.ope.dr).toBe(0.63);
    expect(res.ope.ci_high).toBe(0.71);
  });

  it("defaults to an empty body when no params are provided", async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/demo/simulate-rounds`,
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(sample);
        },
      ),
    );

    await client().ml.simulateRounds("demo");
    expect(body).toEqual({});
  });

  it("rejects an empty useCase", async () => {
    await expect(client().ml.simulateRounds("")).rejects.toThrow(
      "useCase must be a non-empty string",
    );
  });
});

// ---------------------------------------------------------------------------
// 7. feedback  (the unified call)
// ---------------------------------------------------------------------------

describe("Ml.recordFeedback", () => {
  it("POSTs to .../feedback and decodes the unified ack", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/feedback`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({
            ok: true,
            use_case: "lead_score",
            converted: true,
            outcome_recorded: true,
            bandit_updated: true,
            bandit_n: 43,
            message: "outcome recorded; bandit updated",
          });
        },
      ),
    );

    const res = await client().ml.recordFeedback("lead_score", {
      subject_id: "lead-1",
      features: { budget: 3_000_000 },
      converted: true,
      predicted_score: 82,
      note: "won the deal",
      action_id: "call",
      context: { score: 0.82, band: "hot" },
      action_features: { cost: 5 },
      propensity: 0.7,
      reward: 1,
    });

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("POST");
    expect(captured!.url).toBe(
      `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/feedback`,
    );
    expect(captured!.body).toEqual({
      subject_id: "lead-1",
      features: { budget: 3_000_000 },
      converted: true,
      predicted_score: 82,
      note: "won the deal",
      action_id: "call",
      context: { score: 0.82, band: "hot" },
      action_features: { cost: 5 },
      propensity: 0.7,
      reward: 1,
    });
    expect(res.ok).toBe(true);
    expect(res.use_case).toBe("lead_score");
    expect(res.converted).toBe(true);
    expect(res.outcome_recorded).toBe(true);
    expect(res.bandit_updated).toBe(true);
    expect(res.bandit_n).toBe(43);
    expect(res.message).toBe("outcome recorded; bandit updated");
  });

  it("sends only converted when minimal (no action_id → no bandit update)", async () => {
    let captured: Captured | null = null;
    server.use(
      http.post(
        `${BASE_URL}/api/v1/builtin-agents/ml/lead_score/feedback`,
        async ({ request }) => {
          captured = {
            method: request.method,
            url: request.url,
            body: (await request.json()) as Record<string, unknown>,
          };
          return HttpResponse.json({
            ok: true,
            use_case: "lead_score",
            converted: false,
            outcome_recorded: true,
            bandit_updated: false,
            message: "outcome recorded",
          });
        },
      ),
    );

    const res = await client().ml.recordFeedback("lead_score", {
      converted: false,
    });

    expect(captured!.body).toEqual({ converted: false });
    expect(res.bandit_updated).toBe(false);
    expect(res.bandit_n).toBeUndefined();
  });

  it("rejects an empty useCase", async () => {
    await expect(
      client().ml.recordFeedback("", { converted: true }),
    ).rejects.toThrow("useCase must be a non-empty string");
  });
});

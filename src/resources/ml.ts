import type { HTTPClient } from "../http.js";
import type {
  DecideNBAParams,
  DecideNBAResult,
  EvaluateOPEParams,
  EvaluateOPEResult,
  LearnNBAParams,
  LearnNBAResult,
  PredictScoreParams,
  PredictScoreResult,
  RecordFeedbackParams,
  RecordFeedbackResult,
  SimulateRoundsParams,
  SimulateRoundsResult,
  TrainScoringParams,
  TrainScoringResult,
} from "../types.js";

function requireNonEmpty(value: string, name: string): void {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
}

/**
 * Training and the end-to-end simulation are long-running (auto-tuned
 * hyperparameter search / many in-process learning rounds), so they get a
 * generous deadline instead of the client-level default — mirroring the
 * built-in agent run timeout and the Go SDK's `PostLongRunning`.
 */
const ML_LONG_RUNNING_TIMEOUT_MS = 1_200_000;

/**
 * Sonzai ML — the platform's generalized, multi-tenant / multi-vertical ML &
 * RL primitives: supervised scoring (train + calibrated predict),
 * contextual-bandit next-best-action (decide + learn), off-policy evaluation,
 * an end-to-end learning simulation, and a single unified feedback call.
 *
 * Every method is keyed by a free-form `useCase` string (e.g. "lead_score",
 * "claim_triage", "churn") so a single tenant can run many independent models.
 * All calls are tenant-scoped server-side by the caller's API key — no tenant
 * argument is needed. Endpoints live under
 * `/api/v1/builtin-agents/ml/{use_case}/...`.
 *
 * @example
 * ```ts
 * // 1. Train a calibrated scoring model
 * const model = await client.ml.trainScoring("lead_score", {
 *   rows: [
 *     { features: { budget: 5_000_000, region: "PH" }, label: 1 },
 *     { features: { budget: 800_000, region: "PH" }, label: 0 },
 *   ],
 * });
 * console.log(model.auc, model.model_version);
 *
 * // 2. Score a live lead
 * const { score } = await client.ml.predictScore("lead_score", {
 *   features: { budget: 3_000_000, region: "PH" },
 * });
 *
 * // 3. Pick the next best action (contextual bandit)
 * const decision = await client.ml.decideNba("lead_score", {
 *   context: { score, band: "hot" },
 *   actions: [
 *     { id: "call", features: { cost: 5 } },
 *     { id: "sms", features: { cost: 1 } },
 *   ],
 * });
 *
 * // 4. Teach the platform from the realized outcome (one unified call)
 * await client.ml.recordFeedback("lead_score", {
 *   subject_id: "lead-1",
 *   converted: true,
 *   action_id: decision.action_id,
 *   context: { score, band: "hot" },
 *   propensity: decision.propensity,
 * });
 * ```
 */
export class Ml {
  constructor(private readonly http: HTTPClient) {}

  /**
   * Train (or retrain) the calibrated scoring model for the given use case
   * from the labeled rows; returns its held-out metrics, chosen
   * hyperparameters, and new model version.
   *
   * Long-running — training auto-tunes hyperparameters, so the SDK applies a
   * 20-minute deadline to this call instead of the client-level timeout.
   */
  async trainScoring(
    useCase: string,
    params: TrainScoringParams,
  ): Promise<TrainScoringResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.request<TrainScoringResult>(
      "POST",
      `/api/v1/builtin-agents/ml/${useCase}/scoring/train`,
      {
        body: params as unknown as Record<string, unknown>,
        timeoutMs: ML_LONG_RUNNING_TIMEOUT_MS,
      },
    );
  }

  /**
   * Return the calibrated score for a single example using the use case's
   * current scoring model.
   */
  async predictScore(
    useCase: string,
    params: PredictScoreParams,
  ): Promise<PredictScoreResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.post<PredictScoreResult>(
      `/api/v1/builtin-agents/ml/${useCase}/scoring/predict`,
      params as unknown as Record<string, unknown>,
    );
  }

  /**
   * Choose the next best action among the candidate slate for the given use
   * case and context, returning the chosen action and the full scored slate.
   * Record the returned `propensity` and pass it back to {@link learnNba} (or
   * {@link recordFeedback}) when the reward is realized.
   */
  async decideNba(
    useCase: string,
    params: DecideNBAParams,
  ): Promise<DecideNBAResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.post<DecideNBAResult>(
      `/api/v1/builtin-agents/ml/${useCase}/nba/decide`,
      params as unknown as Record<string, unknown>,
    );
  }

  /**
   * Record the realized reward for a previously taken action, updating the use
   * case's bandit policy.
   */
  async learnNba(
    useCase: string,
    params: LearnNBAParams,
  ): Promise<LearnNBAResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.post<LearnNBAResult>(
      `/api/v1/builtin-agents/ml/${useCase}/nba/learn`,
      params as unknown as Record<string, unknown>,
    );
  }

  /**
   * Run off-policy evaluation of the use case's current policy against a batch
   * of logged decisions, returning IPS/SNIPS/DR value estimates with a
   * confidence interval and effective sample size.
   */
  async evaluateOpe(
    useCase: string,
    params: EvaluateOPEParams,
  ): Promise<EvaluateOPEResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.post<EvaluateOPEResult>(
      `/api/v1/builtin-agents/ml/${useCase}/ope/evaluate`,
      params as unknown as Record<string, unknown>,
    );
  }

  /**
   * Run the entire self-learning loop end-to-end in one call: the platform
   * repeatedly accrues outcomes, retrains the auto-tuned scoring model, runs
   * the contextual bandit (decide → reward → learn), and off-policy-evaluates
   * the policy — for `rounds` rounds on a built-in synthetic scenario — then
   * returns the per-round learning curve plus the final model and learned
   * policy.
   *
   * Long-running — the run takes tens of seconds, so the SDK applies a
   * 20-minute deadline to this call instead of the client-level timeout. The
   * run is self-contained and reproducible (pass a `seed`) and uses an
   * ephemeral model scoped to `useCase`, so it never affects production models
   * or the cross-tenant global prior.
   */
  async simulateRounds(
    useCase: string,
    params: SimulateRoundsParams = {},
  ): Promise<SimulateRoundsResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.request<SimulateRoundsResult>(
      "POST",
      `/api/v1/builtin-agents/ml/${useCase}/simulate-rounds`,
      {
        body: params as unknown as Record<string, unknown>,
        timeoutMs: ML_LONG_RUNNING_TIMEOUT_MS,
      },
    );
  }

  /**
   * The single unified operator call for teaching the platform from a realized
   * outcome. It persists the labeled outcome for the use case's scoring model
   * (which retrains on the platform schedule) and, when `action_id` is set,
   * immediately teaches the bandit the realized reward. `reward` defaults to
   * `converted ? 1 : 0` when not supplied. Prefer this over composing the
   * scoring-outcome and {@link learnNba} calls by hand.
   */
  async recordFeedback(
    useCase: string,
    params: RecordFeedbackParams,
  ): Promise<RecordFeedbackResult> {
    requireNonEmpty(useCase, "useCase");
    return this.http.post<RecordFeedbackResult>(
      `/api/v1/builtin-agents/ml/${useCase}/feedback`,
      params as unknown as Record<string, unknown>,
    );
  }
}

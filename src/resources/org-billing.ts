import type { HTTPClient } from "../http.js";
import type {
  OrgBillingCheckoutOptions,
  OrgBillingRedeemVoucherOptions,
  OrgBillingSubscribeOptions,
} from "../types.js";

/**
 * Org-level billing operations.
 *
 * Stripe checkout/portal, credit ledger, usage summaries, enterprise
 * contracts, vouchers. Most GET responses are untyped on the server side
 * and returned as plain records.
 */
export class OrgBilling {
  constructor(private readonly http: HTTPClient) {}

  // --- profile / usage ---

  /** Get the org billing profile (plan, credits, Stripe customer, etc.). */
  getBilling(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>("/api/v1/org/billing");
  }

  /** Get a high-level usage summary. */
  getUsageSummary(days?: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      "/api/v1/org/usage-summary",
      days != null ? { days } : undefined,
    );
  }

  /** Get detailed per-service usage. */
  getServiceUsage(days?: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      "/api/v1/org/service-usage",
      days != null ? { days } : undefined,
    );
  }

  /** Context-engine event usage for the given lookback window. */
  getContextEngineEvents(days?: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      "/api/v1/org/events",
      days != null ? { days } : undefined,
    );
  }

  /** Get the org billing ledger. */
  getLedger(days?: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      "/api/v1/org/ledger",
      days != null ? { days } : undefined,
    );
  }

  /** List active characters for billing purposes. */
  listActiveCharacters(days?: number): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      "/api/v1/org/characters",
      days != null ? { days } : undefined,
    );
  }

  /** Get active model pricing (per-token rates by provider/model). */
  getModelPricing(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>("/api/v1/org/model-pricing");
  }

  // --- contracts ---

  /** Get the org's enterprise contract (if any). */
  getContract(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>("/api/v1/org/contract");
  }

  /** List active service agreements. */
  listServiceAgreements(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>("/api/v1/org/service-agreements");
  }

  /** Subscribe the tenant to an enterprise contract. */
  subscribeToContract(
    options: OrgBillingSubscribeOptions,
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/org/contract/subscribe",
      options as unknown as Record<string, unknown>,
    );
  }

  // --- Stripe sessions ---

  /** Create a Stripe checkout session for a credit top-up. */
  createCheckout(
    options: OrgBillingCheckoutOptions,
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/org/billing/checkout",
      options as unknown as Record<string, unknown>,
    );
  }

  /** Create a Stripe billing-portal session. */
  createPortal(): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>("/api/v1/org/billing/portal", {});
  }

  // --- vouchers ---

  /** Redeem a voucher code. */
  redeemVoucher(
    options: OrgBillingRedeemVoucherOptions,
  ): Promise<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      "/api/v1/org/vouchers/redeem",
      options as unknown as Record<string, unknown>,
    );
  }
}

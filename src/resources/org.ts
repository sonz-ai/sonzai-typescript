import type { HTTPClient } from "../http.js";
import type {
  OrgBillingCheckoutInputBody,
  OrgBillingSubscribeInputBody,
  OrgBillingURLBody,
  OrgBillingVoucherInputBody,
  OrgResponse,
  OrgUsageSummaryBody,
  RedeemVoucherResponse,
} from "../generated/flat-exports.js";

export interface CreateBillingCheckoutOptions {
  amount: number;
  currency?: string;
}

export interface SubscribeContractOptions {
  contractId: string;
}

export interface LedgerListOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Organization-level billing, contracts, ledgers, vouchers, and pricing.
 *
 * Wraps `/api/v1/org/...` plus the tenant-facing `/api/v1/me`. These are
 * platform-management endpoints — for app developers building on the
 * Mind Layer they're rarely used; for admin/billing UIs they're essential.
 */
export class Org {
  constructor(private readonly http: HTTPClient) {}

  /** Current authenticated user with their organizations. */
  async me(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/me");
  }

  /** Read the organization's billing profile. */
  async getBilling(): Promise<OrgResponse> {
    return this.http.get<OrgResponse>("/api/v1/org/billing");
  }

  /**
   * Create a Stripe checkout session for a top-up. Returns a hosted
   * checkout URL the caller should redirect the end user to.
   */
  async createBillingCheckout(
    options: CreateBillingCheckoutOptions,
  ): Promise<OrgBillingURLBody> {
    const body: OrgBillingCheckoutInputBody = {
      amount: options.amount,
      ...(options.currency !== undefined ? { currency: options.currency } : {}),
    } as OrgBillingCheckoutInputBody;
    return this.http.post<OrgBillingURLBody>(
      "/api/v1/org/billing/checkout",
      body as unknown as Record<string, unknown>,
    );
  }

  /** Create a Stripe customer-portal link. */
  async createBillingPortal(
    body: Record<string, unknown> = {},
  ): Promise<OrgBillingURLBody> {
    return this.http.post<OrgBillingURLBody>("/api/v1/org/billing/portal", body);
  }

  /** Paginated billing ledger. */
  async getLedger(
    options: LedgerListOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/ledger", {
      limit: options.limit,
      cursor: options.cursor,
    });
  }

  /** Read the active enterprise contract. */
  async getContract(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/contract");
  }

  /** Subscribe the org to a specific enterprise contract by ID. */
  async subscribeContract(
    options: SubscribeContractOptions,
  ): Promise<Record<string, unknown>> {
    const body: OrgBillingSubscribeInputBody = {
      contractId: options.contractId,
    } as OrgBillingSubscribeInputBody;
    return this.http.post(
      "/api/v1/org/contract/subscribe",
      body as unknown as Record<string, unknown>,
    );
  }

  /** List the org's service agreements. */
  async listServiceAgreements(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/service-agreements");
  }

  /** Current service-usage counters. */
  async getServiceUsage(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/service-usage");
  }

  /** Aggregated usage summary across the billing period. */
  async getUsageSummary(): Promise<OrgUsageSummaryBody> {
    return this.http.get<OrgUsageSummaryBody>("/api/v1/org/usage-summary");
  }

  /** Per-model pricing (input/output token rates) currently in effect. */
  async getModelPricing(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/model-pricing");
  }

  /** Active billing characters (the "active agents" billed this period). */
  async listActiveCharacters(): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/characters");
  }

  /** Aggregated context-engine event log, paginated. */
  async getContextEngineEvents(
    options: LedgerListOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.http.get("/api/v1/org/events", {
      limit: options.limit,
      cursor: options.cursor,
    });
  }

  /** Redeem a promo / credit voucher. */
  async redeemVoucher(code: string): Promise<RedeemVoucherResponse> {
    const body: OrgBillingVoucherInputBody = {
      code,
    } as OrgBillingVoucherInputBody;
    return this.http.post<RedeemVoucherResponse>(
      "/api/v1/org/vouchers/redeem",
      body as unknown as Record<string, unknown>,
    );
  }
}

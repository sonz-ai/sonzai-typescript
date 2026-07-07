import type { HTTPClient } from "../http.js";
import type {
	IngestContact,
	IngestContactParams,
	IngestEventParams,
	IngestEventResult,
	ListIngestEventsOptions,
	ListIngestEventsResult,
} from "../types.js";

/**
 * Adapter ingestion — a customer-owned adapter (running in the customer's
 * environment, e.g. a CRM sidecar under app-runtime) normalizes its own
 * events/contacts and POSTs them here, so the platform's pipelines,
 * lead-assignment ledger, and outbound webhooks can react — without the
 * platform ever holding CRM tables.
 *
 * Endpoints live under `/api/v1/ingest/*`.
 *
 * @example
 * ```ts
 * await client.ingest.sendEvent({
 *   event_id: crypto.randomUUID(),
 *   type: "lead.created",
 *   occurred_at: new Date().toISOString(),
 *   lead_ref: "sf-lead-001",
 *   payload: { source: "salesforce" },
 * });
 * ```
 */
export class Ingest {
	constructor(private readonly http: HTTPClient) {}

	/**
	 * Store a normalized DomainEvent v1 (idempotent on `event_id` per
	 * project) and fan it out to the project's notification channels under
	 * the event's own type. A replay of an already-stored event_id returns
	 * `duplicate: true` and skips fan-out.
	 */
	async sendEvent(params: IngestEventParams): Promise<IngestEventResult> {
		return this.http.post<IngestEventResult>(
			"/api/v1/ingest/events",
			params as unknown as Record<string, unknown>,
		);
	}

	/**
	 * Create or replace a contact/rep registry entry keyed by `contact_ref`
	 * within the project (last write wins). The rep registry links external
	 * CRM identities (`crm_owner_id`) to the platform.
	 */
	async upsertContact(params: IngestContactParams): Promise<IngestContact> {
		return this.http.post<IngestContact>(
			"/api/v1/ingest/contacts",
			params as unknown as Record<string, unknown>,
		);
	}

	/**
	 * Return a project's stored events in keyset (created_at, id) order
	 * at/after `since`, paged by `cursor`. A read-only completeness/gap
	 * check for write-back adapters: webhook delivery is best-effort, so an
	 * adapter reconciles by listing platform-known events and re-applying
	 * any it has not yet synced.
	 */
	async listEvents(
		options: ListIngestEventsOptions,
	): Promise<ListIngestEventsResult> {
		return this.http.get<ListIngestEventsResult>("/api/v1/ingest/events", {
			since: options.since,
			limit: options.limit,
			cursor: options.cursor,
		});
	}
}

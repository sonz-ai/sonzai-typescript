import type { HTTPClient } from "../http.js";
import type {
	CrmEvent,
	CrmEventsOptions,
	CrmEventsPage,
	CrmImportContactsOptions,
	CrmImportResult,
} from "../types.js";

function requireRuntime(http: HTTPClient | undefined): HTTPClient {
	if (!http) {
		throw new Error(
			"runtimeBaseUrl and runtimeApiKey (ADAPTER_TOKEN) must be provided to use client.crm runtime CRM methods",
		);
	}
	return http;
}

/**
 * Runtime-local CRM adapter surface.
 *
 * These endpoints are served by a deployed app-runtime instance under
 * `/api/rt/crm/*`, not by the Sonzai platform API. Configure `runtimeBaseUrl`
 * on the client and authenticate with the runtime's adapter token.
 */
export class Crm {
	constructor(private readonly http?: HTTPClient) {}

	/**
	 * Bulk upsert contacts into the runtime CRM. Contacts are idempotent on
	 * `external_ref` within the runtime tenant.
	 */
	async import(options: CrmImportContactsOptions): Promise<CrmImportResult> {
		return requireRuntime(this.http).post<CrmImportResult>(
			"/api/rt/crm/import",
			{ contacts: options.contacts },
		);
	}

	/**
	 * Alias for {@link import}; useful in codebases that avoid reserved-word
	 * property access.
	 */
	async importContacts(
		options: CrmImportContactsOptions,
	): Promise<CrmImportResult> {
		return this.import(options);
	}

	/**
	 * Fetch one page of runtime CRM change events. Feed `next_cursor` back as
	 * a non-empty `next_cursor` back as `cursor` to continue from the previous
	 * page.
	 */
	async events(options: CrmEventsOptions = {}): Promise<CrmEventsPage> {
		return requireRuntime(this.http).get<CrmEventsPage>("/api/rt/crm/events", {
			cursor: options.cursor,
			limit: options.limit,
		});
	}

	/**
	 * Iterate CRM change events across cursor pages until the runtime returns an
	 * empty page or an empty/non-advancing `next_cursor`.
	 */
	async *iterateEvents(
		options: CrmEventsOptions = {},
	): AsyncGenerator<CrmEvent> {
		let cursor = options.cursor;

		while (true) {
			const page = await this.events({ ...options, cursor });
			for (const event of page.events) {
				yield event;
			}

			if (
				page.events.length === 0 ||
				!page.next_cursor ||
				page.next_cursor === cursor
			) {
				return;
			}
			cursor = page.next_cursor;
		}
	}
}

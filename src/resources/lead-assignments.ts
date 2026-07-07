import type { HTTPClient } from "../http.js";
import type {
	LeadAssignment,
	ListLeadAssignmentsOptions,
	ListLeadAssignmentsResult,
	OfferLeadAssignmentParams,
	OfferLeadAssignmentResult,
} from "../types.js";

function requireNonEmpty(value: string, name: string): void {
	if (!value || typeof value !== "string" || value.trim() === "") {
		throw new Error(`${name} must be a non-empty string`);
	}
}

/**
 * Lead Assignments — the tenant-generic work-distribution primitive (any
 * vertical: leads, tickets, shifts). Offer a unit of work (identified by the
 * caller-owned `lead_ref`) to one rep from a candidate roster, chosen by the
 * named policy (`round_robin` default, or `load_balanced`). At most one
 * active assignment can exist per lead: offering a lead that already has an
 * active (offered/claimed) assignment returns the existing assignment with
 * `deduplicated: true` instead of creating a second one. The offer expires
 * after `sla_seconds` (platform default 900); the background sweep then
 * re-offers it to the next candidate who hasn't had it yet, or expires it
 * when the roster is exhausted.
 *
 * Endpoints live under `/api/v1/lead-assignments*`.
 *
 * @example
 * ```ts
 * const { assignment, deduplicated } = await client.leadAssignments.offer({
 *   lead_ref: "lead-123",
 *   candidates: ["rep-1", "rep-2"],
 * });
 * if (!deduplicated) {
 *   await client.leadAssignments.claim(assignment.assignment_id);
 * }
 * ```
 */
export class LeadAssignments {
	constructor(private readonly http: HTTPClient) {}

	/**
	 * Distribute a unit of work to one rep from the candidate roster. Returns
	 * the pre-existing assignment with `deduplicated: true` when the lead
	 * already has an active one.
	 */
	async offer(
		params: OfferLeadAssignmentParams,
	): Promise<OfferLeadAssignmentResult> {
		return this.http.post<OfferLeadAssignmentResult>(
			"/api/v1/lead-assignments/offer",
			params as unknown as Record<string, unknown>,
		);
	}

	/**
	 * List the project's assignment ledger rows, newest offer first,
	 * optionally filtered by rep and/or state.
	 */
	async list(
		options: ListLeadAssignmentsOptions = {},
	): Promise<ListLeadAssignmentsResult> {
		return this.http.get<ListLeadAssignmentsResult>(
			"/api/v1/lead-assignments",
			{
				rep_user_id: options.repUserId,
				state: options.state,
				limit: options.limit,
			},
		);
	}

	/** Read one lead assignment by id. */
	async get(assignmentId: string): Promise<LeadAssignment> {
		requireNonEmpty(assignmentId, "assignmentId");
		return this.http.get<LeadAssignment>(
			`/api/v1/lead-assignments/${assignmentId}`,
		);
	}

	/**
	 * Claim an offered lead — the rep accepted the work before the SLA
	 * lapsed. 409 when the assignment is not in the offered state.
	 */
	async claim(assignmentId: string): Promise<LeadAssignment> {
		requireNonEmpty(assignmentId, "assignmentId");
		return this.http.post<LeadAssignment>(
			`/api/v1/lead-assignments/${assignmentId}/claim`,
		);
	}

	/**
	 * Release an offered or claimed lead back to the pool, freeing it to be
	 * offered again. 409 when the assignment is already terminal.
	 */
	async release(assignmentId: string): Promise<LeadAssignment> {
		requireNonEmpty(assignmentId, "assignmentId");
		return this.http.post<LeadAssignment>(
			`/api/v1/lead-assignments/${assignmentId}/release`,
		);
	}

	/**
	 * Mark a claimed lead completed. 409 when the assignment is not in the
	 * claimed state.
	 */
	async complete(assignmentId: string): Promise<LeadAssignment> {
		requireNonEmpty(assignmentId, "assignmentId");
		return this.http.post<LeadAssignment>(
			`/api/v1/lead-assignments/${assignmentId}/complete`,
		);
	}
}

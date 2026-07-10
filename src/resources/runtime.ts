import type { HTTPClient } from "../http.js";

export const RUNTIME_USAGE_SCHEMA_VERSION = 2 as const;

export type RuntimeBillingMode = "standard" | "byok";

export interface RuntimeContextBundleInput {
	user_id: string;
	session_id: string;
	current_message?: string;
}

export interface RuntimeContextBundle {
	system_prompt_parts: string[];
	memory_context: Record<string, unknown>;
	persona?: Record<string, unknown>;
	tool_definitions: unknown[];
	ttl: number;
}

export interface RuntimeBackendAgentArtifact {
	slug: string;
	name: string;
	description: string;
	model_hint: string;
	system: string;
	findings_schema?: Record<string, unknown>;
	tools?: string[];
	disable_tools: boolean;
	max_tool_rounds: number;
	version: string;
}

export interface RuntimeToolCall {
	id: string;
	type: string;
	function: { name: string; arguments: string };
}

export interface RuntimeTurnMessage {
	role: "user" | "assistant" | "tool" | "system";
	content?: string | null;
	timestamp?: string;
	tool_call_id?: string;
	tool_calls?: RuntimeToolCall[];
	author?: string;
}

export interface RuntimeCompletedTurn {
	user_message: RuntimeTurnMessage;
	assistant_message: RuntimeTurnMessage;
	tool_results?: RuntimeTurnMessage[];
}

export interface RuntimeTurnReport {
	user_id: string;
	session_id: string;
	instance_id?: string;
	user_display_name?: string;
	messages?: RuntimeTurnMessage[];
	turns?: RuntimeCompletedTurn[];
}

export interface RuntimeTurnReportResult {
	accepted: boolean;
	agent_id: string;
	user_id: string;
	session_id: string;
	messages_stored: number;
}

export interface RuntimeConversationOptions {
	userId: string;
	sessionId: string;
	page?: number;
	pageSize?: number;
}

export interface RuntimeConversation {
	agent_id: string;
	user_id: string;
	session_id: string;
	page: number;
	page_size: number;
	total: number;
	has_more: boolean;
	messages: RuntimeTurnMessage[];
}

export interface RuntimeUsageCounter {
	project_id: string;
	agent_id: string;
	provider: string;
	model: string;
	use_case: string;
	billing_mode: RuntimeBillingMode;
	tokens_in: number;
	tokens_out: number;
	cache_read_tokens: number;
	cache_creation_tokens: number;
	turns: number;
	unreported_turns: number;
}

export interface RuntimeUsageReport {
	schema_version: number;
	report_id: string;
	tenant_id: string;
	instance_id?: string;
	period_start: string;
	period_end: string;
	heartbeat_at: string;
	counters: RuntimeUsageCounter[];
	signature: string;
}

export interface RuntimeUsageReportResult {
	accepted: boolean;
	report_id: string;
}

/**
 * Platform control-plane operations needed by a custom runtime. Provider
 * inference is intentionally absent: runtimes call providers directly.
 */
export class Runtime {
	constructor(private readonly http: HTTPClient) {}

	/** Download prompt/schema artifacts; execution remains inside this runtime. */
	backendAgentArtifacts(): Promise<{
		artifacts: RuntimeBackendAgentArtifact[];
	}> {
		return this.http.get("/api/v1/runtime/backend-agent-artifacts");
	}

	contextBundle(
		agentId: string,
		input: RuntimeContextBundleInput,
	): Promise<RuntimeContextBundle> {
		return this.http.post<RuntimeContextBundle>(
			`/api/v1/agents/${encodeURIComponent(agentId)}/context-bundle`,
			input as unknown as Record<string, unknown>,
		);
	}

	conversation(
		agentId: string,
		options: RuntimeConversationOptions,
	): Promise<RuntimeConversation> {
		return this.http.get<RuntimeConversation>(
			`/api/v1/agents/${encodeURIComponent(agentId)}/conversations`,
			{
				user_id: options.userId,
				session_id: options.sessionId,
				page: options.page,
				page_size: options.pageSize,
			},
		);
	}

	reportTurns(
		agentId: string,
		report: RuntimeTurnReport,
	): Promise<RuntimeTurnReportResult> {
		return this.http.post<RuntimeTurnReportResult>(
			`/api/v1/agents/${encodeURIComponent(agentId)}/turns`,
			report as unknown as Record<string, unknown>,
		);
	}

	submitUsageReport(
		report: RuntimeUsageReport,
	): Promise<RuntimeUsageReportResult> {
		return this.http.post<RuntimeUsageReportResult>(
			"/api/v1/usage/reports",
			report as unknown as Record<string, unknown>,
			undefined,
			{ "X-Sonzai-Metering-Signature": report.signature },
		);
	}
}

/** Return the stable cross-language signing payload for a v2 usage report. */
export function canonicalRuntimeUsageReport(
	report: RuntimeUsageReport,
): string {
	const counters = [...report.counters].sort((a, b) =>
		runtimeUsageCounterSortKey(a).localeCompare(runtimeUsageCounterSortKey(b)),
	);
	const lines = [
		String(report.schema_version || RUNTIME_USAGE_SCHEMA_VERSION),
		report.report_id,
		report.tenant_id,
		report.instance_id ?? "",
		canonicalTimestamp(report.period_start),
		canonicalTimestamp(report.period_end),
		canonicalTimestamp(report.heartbeat_at),
	];
	for (const counter of counters) {
		lines.push(
			[
				counter.project_id,
				counter.agent_id,
				counter.provider,
				counter.model,
				counter.use_case,
				counter.billing_mode,
				counter.tokens_in,
				counter.tokens_out,
				counter.cache_read_tokens,
				counter.cache_creation_tokens,
				counter.turns,
				counter.unreported_turns,
			].join("\t"),
		);
	}
	return lines.join("\n");
}

/** Sign a usage report with lowercase hex HMAC-SHA256. */
export async function signRuntimeUsageReport(
	report: RuntimeUsageReport,
	key: string,
): Promise<string> {
	const cryptoKey = await globalThis.crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(key),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await globalThis.crypto.subtle.sign(
		"HMAC",
		cryptoKey,
		new TextEncoder().encode(canonicalRuntimeUsageReport(report)),
	);
	return Array.from(new Uint8Array(signature), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

function runtimeUsageCounterSortKey(counter: RuntimeUsageCounter): string {
	return [
		counter.project_id,
		counter.agent_id,
		counter.provider,
		counter.model,
		counter.use_case,
		counter.billing_mode,
	].join("\0");
}

function canonicalTimestamp(value: string): string {
	return value.replace(/(\.\d*?[1-9])0+Z$/u, "$1Z").replace(/\.0+Z$/u, "Z");
}

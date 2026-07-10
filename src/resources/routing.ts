import type {
	ListPermanentRoutesResponse,
	PermanentRouteBody,
	Config as RoutingConfig,
} from "../generated/flat-exports.js";
import type { HTTPClient } from "../http.js";

export type { RoutingConfig, ListPermanentRoutesResponse, PermanentRouteBody };

export interface ClassifyContactInput {
	user_id: string;
	contact_name: string;
	tier: string;
	agent_id: string;
}

/** Project routing configuration and permanent contact-to-agent routes. */
export class Routing {
	constructor(private readonly http: HTTPClient) {}

	getConfig(projectId: string): Promise<RoutingConfig> {
		return this.http.get<RoutingConfig>(
			`/api/v1/projects/${encodeURIComponent(projectId)}/routing-config`,
		);
	}

	putConfig(projectId: string, config: RoutingConfig): Promise<RoutingConfig> {
		return this.http.put<RoutingConfig>(
			`/api/v1/projects/${encodeURIComponent(projectId)}/routing-config`,
			config as unknown as Record<string, unknown>,
		);
	}

	listPermanentRoutes(projectId: string): Promise<ListPermanentRoutesResponse> {
		return this.http.get<ListPermanentRoutesResponse>(
			`/api/v1/projects/${encodeURIComponent(projectId)}/permanent-routes`,
		);
	}

	classifyContact(
		projectId: string,
		input: ClassifyContactInput,
	): Promise<PermanentRouteBody> {
		return this.http.post<PermanentRouteBody>(
			`/api/v1/projects/${encodeURIComponent(projectId)}/permanent-routes`,
			input as unknown as Record<string, unknown>,
		);
	}

	overridePermanentRoute(
		projectId: string,
		userId: string,
		agentId: string,
	): Promise<PermanentRouteBody> {
		return this.http.post<PermanentRouteBody>(
			`/api/v1/projects/${encodeURIComponent(projectId)}/permanent-routes/${encodeURIComponent(userId)}/override`,
			{ agent_id: agentId },
		);
	}
}

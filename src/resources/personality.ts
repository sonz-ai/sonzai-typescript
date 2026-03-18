import type { HTTPClient } from "../http.js";
import type {
  PersonalityGetOptions,
  PersonalityResponse,
  PersonalityUpdateOptions,
  PersonalityUpdateResponse,
} from "../types.js";

export class Personality {
  constructor(private readonly http: HTTPClient) {}

  /** Get personality profile and evolution history. */
  async get(
    agentId: string,
    options: PersonalityGetOptions = {},
  ): Promise<PersonalityResponse> {
    return this.http.get<PersonalityResponse>(
      `/api/v1/agents/${agentId}/personality`,
      {
        history_limit: options.historyLimit,
        since: options.since,
      },
    );
  }

  /** Update an agent's Big5 personality scores. */
  async update(
    agentId: string,
    options: PersonalityUpdateOptions,
  ): Promise<PersonalityUpdateResponse> {
    const body: Record<string, unknown> = { big5: options.big5 };
    if (options.assessmentMethod)
      body.assessment_method = options.assessmentMethod;
    if (options.totalExchanges)
      body.total_exchanges = options.totalExchanges;

    return this.http.put<PersonalityUpdateResponse>(
      `/api/v1/agents/${agentId}/personality`,
      body,
    );
  }
}

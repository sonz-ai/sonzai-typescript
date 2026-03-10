import type { HTTPClient } from "../http.js";
import type { PersonalityGetOptions, PersonalityResponse } from "../types.js";

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
}

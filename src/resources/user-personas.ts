import type { HTTPClient } from "../http.js";
import type {
  UserPersonaRecord,
  UserPersonaListResponse,
  CreateUserPersonaOptions,
  UpdateUserPersonaOptions,
  DeleteUserPersonaResponse,
} from "../types.js";

export class UserPersonas {
  constructor(private readonly http: HTTPClient) {}

  /** List all user personas for the current tenant. */
  list(): Promise<UserPersonaListResponse> {
    return this.http.get<UserPersonaListResponse>("/api/v1/user-personas");
  }

  /** Create a new user persona. */
  create(options: CreateUserPersonaOptions): Promise<UserPersonaRecord> {
    const body: Record<string, unknown> = { name: options.name };
    if (options.description) body.description = options.description;
    if (options.style) body.style = options.style;
    return this.http.post<UserPersonaRecord>("/api/v1/user-personas", body);
  }

  /** Get a user persona by ID. */
  get(personaId: string): Promise<UserPersonaRecord> {
    return this.http.get<UserPersonaRecord>(`/api/v1/user-personas/${personaId}`);
  }

  /** Update a user persona. */
  update(personaId: string, options: UpdateUserPersonaOptions): Promise<UserPersonaRecord> {
    const body: Record<string, unknown> = {};
    if (options.name) body.name = options.name;
    if (options.description) body.description = options.description;
    if (options.style) body.style = options.style;
    return this.http.put<UserPersonaRecord>(`/api/v1/user-personas/${personaId}`, body);
  }

  /** Delete a user persona. */
  delete(personaId: string): Promise<DeleteUserPersonaResponse> {
    return this.http.delete<DeleteUserPersonaResponse>(`/api/v1/user-personas/${personaId}`);
  }
}

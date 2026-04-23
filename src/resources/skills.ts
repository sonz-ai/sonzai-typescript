import type { HTTPClient } from "../http.js";
import type {
  Skill,
  ProjectSkillBody,
  UpdateProjectSkillInputBody,
  ListProjectSkillsOutputBody,
  ListEnabledSkillsOutputBody,
  ToggleEnabledSkillInputBody,
  ToggleEnabledSkillOutputBody,
  GetSkillLoadCountOutputBody,
} from "../types.js";

/**
 * Project-scoped skill library + per-agent enablement.
 *
 * A skill is a markdown playbook the agent loads on demand via the
 * `sonzai_load_skill` tool. Developers manage the library at the
 * project level; each agent opts into individual skills via the
 * enablement surface. The `AutoLearnSkills` capability lets the agent
 * author its own skills at runtime via `sonzai_create_skill`.
 */
export class Skills {
  constructor(private readonly http: HTTPClient) {}

  /** List every skill in the project library. */
  async listProjectSkills(projectId: string): Promise<Skill[]> {
    const r = await this.http.get<ListProjectSkillsOutputBody>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skills`,
    );
    return (r.skills ?? []) as Skill[];
  }

  /** Create a new skill in the project library. */
  async createProjectSkill(
    projectId: string,
    body: ProjectSkillBody,
  ): Promise<Skill> {
    return this.http.post<Skill>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skills`,
      body,
    );
  }

  /** Get a specific skill by name. */
  async getProjectSkill(projectId: string, name: string): Promise<Skill> {
    return this.http.get<Skill>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(name)}`,
    );
  }

  /** Update a skill. Only fields present in the body are changed. */
  async updateProjectSkill(
    projectId: string,
    name: string,
    body: UpdateProjectSkillInputBody,
  ): Promise<Skill> {
    return this.http.put<Skill>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(name)}`,
      body,
    );
  }

  /** Delete a skill from the library. */
  async deleteProjectSkill(projectId: string, name: string): Promise<void> {
    await this.http.delete(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skills/${encodeURIComponent(name)}`,
    );
  }

  /** List the skills currently enabled for an agent. */
  async listEnabledSkills(agentId: string): Promise<string[]> {
    const r = await this.http.get<ListEnabledSkillsOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/skills/enabled`,
    );
    return (r.skills ?? []) as string[];
  }

  /** Toggle enablement of a skill for an agent. */
  async toggleSkillEnabled(
    agentId: string,
    body: ToggleEnabledSkillInputBody,
  ): Promise<ToggleEnabledSkillOutputBody> {
    return this.http.post<ToggleEnabledSkillOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/skills/enabled`,
      body,
    );
  }

  /**
   * Read the per-agent load-count for a skill. Bumps once each time the
   * agent calls `sonzai_load_skill` with the matching name — useful for
   * surfacing "top skills" in dashboards.
   */
  async getSkillLoadCount(
    agentId: string,
    skillName: string,
  ): Promise<GetSkillLoadCountOutputBody> {
    return this.http.get<GetSkillLoadCountOutputBody>(
      `/api/v1/agents/${encodeURIComponent(agentId)}/skills/enabled/${encodeURIComponent(skillName)}/load-count`,
    );
  }
}

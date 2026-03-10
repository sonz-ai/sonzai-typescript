import type { HTTPClient } from "../http.js";
import type {
  EvalTemplate,
  EvalTemplateCreateOptions,
  EvalTemplateListResponse,
  EvalTemplateUpdateOptions,
  SessionResponse,
} from "../types.js";

export class EvalTemplates {
  constructor(private readonly http: HTTPClient) {}

  /** List all eval templates. */
  async list(options: { templateType?: string } = {}): Promise<EvalTemplateListResponse> {
    return this.http.get<EvalTemplateListResponse>("/api/v1/eval-templates", {
      type: options.templateType,
    });
  }

  /** Get a specific eval template. */
  async get(templateId: string): Promise<EvalTemplate> {
    return this.http.get<EvalTemplate>(`/api/v1/eval-templates/${templateId}`);
  }

  /** Create a new eval template. */
  async create(options: EvalTemplateCreateOptions): Promise<EvalTemplate> {
    const body: Record<string, unknown> = {
      name: options.name,
      description: options.description ?? "",
      template_type: options.templateType ?? "",
      judge_model: options.judgeModel ?? "gemini-3.1-pro-preview",
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 8192,
      scoring_rubric: options.scoringRubric ?? "",
    };
    if (options.categories) body.categories = options.categories;

    return this.http.post<EvalTemplate>("/api/v1/eval-templates", body);
  }

  /** Update an eval template. */
  async update(
    templateId: string,
    options: EvalTemplateUpdateOptions,
  ): Promise<EvalTemplate> {
    const body: Record<string, unknown> = {};
    if (options.name !== undefined) body.name = options.name;
    if (options.description !== undefined) body.description = options.description;
    if (options.templateType !== undefined) body.template_type = options.templateType;
    if (options.judgeModel !== undefined) body.judge_model = options.judgeModel;
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
    if (options.scoringRubric !== undefined) body.scoring_rubric = options.scoringRubric;
    if (options.categories !== undefined) body.categories = options.categories;

    return this.http.put<EvalTemplate>(
      `/api/v1/eval-templates/${templateId}`,
      body,
    );
  }

  /** Delete an eval template. */
  async delete(templateId: string): Promise<SessionResponse> {
    return this.http.delete<SessionResponse>(
      `/api/v1/eval-templates/${templateId}`,
    );
  }
}

import type { HTTPClient } from "../http.js";
import type {
  GenerateAndCreateOptions,
  GenerateAndCreateResponse,
  GenerateBioOptions,
  GenerateBioResponse,
  GenerateCharacterOptions,
  GenerateCharacterResponse,
  GenerateSeedMemoriesOptions,
  GenerateSeedMemoriesResponse,
  ImageGenerateOptions,
  ImageGenerateResponse,
} from "../types.js";

/** AI content generation operations for agents. */
export class Generation {
  constructor(private readonly http: HTTPClient) {}

  /** Generate a bio for an agent using AI. */
  async generateBio(
    agentId: string,
    options: GenerateBioOptions = {},
  ): Promise<GenerateBioResponse> {
    const body: Record<string, unknown> = {};
    if (options.name) body.name = options.name;
    if (options.gender) body.gender = options.gender;
    if (options.description) body.description = options.description;
    if (options.userId) body.user_id = options.userId;
    if (options.enrichedContextJson)
      body.enriched_context_json = options.enrichedContextJson;
    if (options.currentBio) body.current_bio = options.currentBio;
    if (options.style) body.style = options.style;
    if (options.instanceId) body.instance_id = options.instanceId;

    return this.http.post<GenerateBioResponse>(
      `/api/v1/agents/${agentId}/bio/generate`,
      body,
    );
  }

  /** Generate a full character profile from a description.
   *  If an agent with the resolved ID already exists, the LLM is skipped and the existing profile is returned.
   */
  async generateCharacter(
    options: GenerateCharacterOptions,
  ): Promise<GenerateCharacterResponse> {
    const body: Record<string, unknown> = { name: options.name };
    if (options.agentId) body.agent_id = options.agentId;
    if (options.gender) body.gender = options.gender;
    if (options.description) body.description = options.description;
    if (options.fields) body.fields = options.fields;
    if (options.provider) body.provider = options.provider;
    if (options.model) body.model = options.model;

    return this.http.post<GenerateCharacterResponse>(
      "/api/v1/agents/generate-character",
      body,
    );
  }

  /** Generate a character and create the agent in one idempotent call.
   *  If the agent already exists, the LLM is skipped and the existing agent is returned.
   *  Safe to call on every app startup.
   */
  async generateAndCreate(
    options: GenerateAndCreateOptions,
  ): Promise<GenerateAndCreateResponse> {
    const body: Record<string, unknown> = { name: options.name };
    if (options.agentId) body.agent_id = options.agentId;
    if (options.gender) body.gender = options.gender;
    if (options.description) body.description = options.description;
    if (options.fields) body.fields = options.fields;
    if (options.projectId) body.project_id = options.projectId;
    if (options.language) body.language = options.language;
    if (options.provider) body.provider = options.provider;
    if (options.model) body.model = options.model;

    return this.http.post<GenerateAndCreateResponse>(
      "/api/v1/agents/generate-and-create",
      body,
    );
  }

  /** Generate seed memories for an agent using AI. */
  async generateSeedMemories(
    agentId: string,
    options: GenerateSeedMemoriesOptions = {},
  ): Promise<GenerateSeedMemoriesResponse> {
    const body: Record<string, unknown> = {};
    if (options.agentName) body.agentName = options.agentName;
    if (options.big5) body.big5 = options.big5;
    if (options.personalityPrompt)
      body.personalityPrompt = options.personalityPrompt;
    if (options.primaryTraits) body.primaryTraits = options.primaryTraits;
    if (options.trueInterests) body.trueInterests = options.trueInterests;
    if (options.trueDislikes) body.trueDislikes = options.trueDislikes;
    if (options.speechPatterns) body.speechPatterns = options.speechPatterns;
    if (options.creatorDisplayName)
      body.creatorDisplayName = options.creatorDisplayName;
    if (options.staticLoreMemories)
      body.staticLoreMemories = options.staticLoreMemories;
    if (options.loreGenerationContext)
      body.loreGenerationContext = options.loreGenerationContext;
    if (options.identityMemoryTemplates)
      body.identityMemoryTemplates = options.identityMemoryTemplates;
    if (options.generateOriginStory != null)
      body.generateOriginStory = options.generateOriginStory;
    if (options.generatePersonalizedMemories != null)
      body.generatePersonalizedMemories = options.generatePersonalizedMemories;

    return this.http.post<GenerateSeedMemoriesResponse>(
      `/api/v1/agents/${agentId}/memory/seed`,
      body,
    );
  }

  /** Generate an image using the agent's context. */
  async generateImage(
    agentId: string,
    options: ImageGenerateOptions,
  ): Promise<ImageGenerateResponse> {
    const body: Record<string, unknown> = { prompt: options.prompt };
    if (options.negativePrompt) body.negative_prompt = options.negativePrompt;
    if (options.model) body.model = options.model;
    if (options.provider) body.provider = options.provider;

    return this.http.post<ImageGenerateResponse>(
      `/api/v1/agents/${agentId}/image/generate`,
      body,
    );
  }
}

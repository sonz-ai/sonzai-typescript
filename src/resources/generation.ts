import type { HTTPClient } from "../http.js";
import type {
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

  /** Generate a full character profile from a description. */
  async generateCharacter(
    options: GenerateCharacterOptions,
  ): Promise<GenerateCharacterResponse> {
    const body: Record<string, unknown> = { name: options.name };
    if (options.gender) body.gender = options.gender;
    if (options.description) body.description = options.description;
    if (options.fields) body.fields = options.fields;

    return this.http.post<GenerateCharacterResponse>(
      "/api/v1/agents/generate-character",
      body,
    );
  }

  /** Generate seed memories for an agent using AI. */
  async generateSeedMemories(
    agentId: string,
    options: GenerateSeedMemoriesOptions = {},
  ): Promise<GenerateSeedMemoriesResponse> {
    const body: Record<string, unknown> = {};
    if (options.userId) body.user_id = options.userId;
    if (options.agentName) body.agentName = options.agentName;
    if (options.big5) body.big5 = options.big5;
    if (options.personalityPrompt)
      body.personalityPrompt = options.personalityPrompt;
    if (options.guideSummary) body.guide_summary = options.guideSummary;
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
    if (options.modelConfig) body.model_config = options.modelConfig;
    if (options.storeMemories != null)
      body.store_memories = options.storeMemories;

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
    if (options.outputBucket) body.output_bucket = options.outputBucket;
    if (options.outputPath) body.output_path = options.outputPath;

    return this.http.post<ImageGenerateResponse>(
      `/api/v1/agents/${agentId}/image/generate`,
      body,
    );
  }
}

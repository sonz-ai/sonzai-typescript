import type { HTTPClient } from "../http.js";
import type {
  TTSOptions,
  TTSResponse,
  VoiceChatOptions,
  VoiceChatResponse,
  VoiceListOptions,
  VoiceListResponse,
  VoiceMatchOptions,
  VoiceMatchResponse,
} from "../types.js";

/** Agent-scoped voice operations (TTS, match, chat). */
export class Voice {
  constructor(private readonly http: HTTPClient) {}

  /** Convert text to speech using the agent's voice. */
  async textToSpeech(
    agentId: string,
    options: TTSOptions,
  ): Promise<TTSResponse> {
    const body: Record<string, unknown> = { text: options.text };
    if (options.voiceName) body.voice_name = options.voiceName;
    if (options.language) body.language = options.language;
    if (options.emotionalContext)
      body.emotional_context = options.emotionalContext;

    return this.http.post<TTSResponse>(
      `/api/v1/agents/${agentId}/voice/tts`,
      body,
    );
  }

  /** Find the best matching voice for an agent based on personality. */
  async voiceMatch(
    agentId: string,
    options: VoiceMatchOptions = {},
  ): Promise<VoiceMatchResponse> {
    const body: Record<string, unknown> = {};
    if (options.big5) body.big5 = options.big5;
    if (options.preferredGender)
      body.preferred_gender = options.preferredGender;

    return this.http.post<VoiceMatchResponse>(
      `/api/v1/agents/${agentId}/voice/match`,
      body,
    );
  }

  /** Perform a single-turn voice chat: send audio, receive text + audio response. */
  async voiceChat(
    agentId: string,
    options: VoiceChatOptions,
  ): Promise<VoiceChatResponse> {
    const body: Record<string, unknown> = { audio: options.audio };
    if (options.userId) body.user_id = options.userId;
    if (options.audioFormat) body.audio_format = options.audioFormat;
    if (options.voiceName) body.voice_name = options.voiceName;
    if (options.continuationToken)
      body.continuation_token = options.continuationToken;
    if (options.language) body.language = options.language;

    return this.http.post<VoiceChatResponse>(
      `/api/v1/agents/${agentId}/voice/chat`,
      body,
    );
  }
}

/** Global voice catalog operations. */
export class Voices {
  constructor(private readonly http: HTTPClient) {}

  /** List available voices from the catalog. */
  async list(options: VoiceListOptions = {}): Promise<VoiceListResponse> {
    return this.http.get<VoiceListResponse>("/api/v1/voices", {
      tier: options.tier,
      gender: options.gender,
      language: options.language,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// Minimal WebSocket type declarations for environments that provide a global
// WebSocket (Node.js >=21, browsers, Bun, Deno). This avoids pulling in DOM
// lib types for the entire project.
declare class WebSocket {
  constructor(url: string);
  binaryType: string;
  send(data: string | ArrayBuffer | Uint8Array): void;
  close(): void;
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "message", listener: (evt: { data: any }) => void): void;
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(type: "error", listener: (evt: any) => void): void;
  removeEventListener(type: string, listener: (...args: any[]) => void): void;
}

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
  VoiceStreamEvent,
  VoiceStreamToken,
  VoiceTokenOptions,
} from "../types.js";

/** Agent-scoped voice operations (TTS, match, chat, streaming). */
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

  /**
   * Get a short-lived token for WebSocket voice streaming.
   * The token expires in 60 seconds and is single-use.
   */
  async getToken(
    agentId: string,
    options: VoiceTokenOptions = {},
  ): Promise<VoiceStreamToken> {
    const body: Record<string, unknown> = {};
    if (options.voiceName) body.voiceName = options.voiceName;
    if (options.language) body.language = options.language;
    if (options.entityContext) body.entityContext = options.entityContext;

    return this.http.post<VoiceStreamToken>(
      `/api/v1/agents/${agentId}/voice/ws-token`,
      body,
    );
  }

  /**
   * Open a bidirectional WebSocket for real-time voice chat.
   *
   * @example
   * ```ts
   * const token = await client.agents.voice.getToken(agentId);
   * const stream = await client.agents.voice.stream(token);
   *
   * stream.sendAudio(audioChunk);
   * stream.endOfSpeech();
   *
   * for await (const event of stream) {
   *   if (event.type === "transcript") console.log("User:", event.text);
   *   if (event.type === "audio") playAudio(event.audio);
   *   if (event.type === "turn_complete") break;
   * }
   *
   * stream.close();
   * ```
   */
  async stream(token: VoiceStreamToken): Promise<VoiceStreamInstance> {
    return VoiceStreamInstance.connect(token);
  }
}

/**
 * Bidirectional WebSocket connection for real-time voice chat.
 *
 * Works in Node.js (>=21 with global WebSocket, or >=18 with `undici`/`ws`)
 * and modern browsers/Bun/Deno which have global WebSocket.
 */
export class VoiceStreamInstance {
  private ws: WebSocket;
  private closed = false;
  private eventQueue: VoiceStreamEvent[] = [];
  private waitResolve: ((value: IteratorResult<VoiceStreamEvent>) => void) | null = null;

  private constructor(ws: WebSocket) {
    this.ws = ws;

    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", (evt) => {
      let event: VoiceStreamEvent;
      if (evt.data instanceof ArrayBuffer) {
        event = { type: "audio", audio: new Uint8Array(evt.data) };
      } else {
        const parsed = JSON.parse(evt.data as string);
        event = {
          type: parsed.type ?? "",
          sessionId: parsed.session_id,
          speaking: parsed.speaking,
          text: parsed.text,
          continuationToken: parsed.continuation_token,
          contentType: parsed.content_type,
          error: parsed.error,
          errorCode: parsed.error_code,
        };
      }

      if (this.waitResolve) {
        const resolve = this.waitResolve;
        this.waitResolve = null;
        resolve({ value: event, done: false });
      } else {
        this.eventQueue.push(event);
      }
    });

    ws.addEventListener("close", () => {
      this.closed = true;
      if (this.waitResolve) {
        const resolve = this.waitResolve;
        this.waitResolve = null;
        resolve({ value: undefined as unknown as VoiceStreamEvent, done: true });
      }
    });

    ws.addEventListener("error", () => {
      this.closed = true;
      if (this.waitResolve) {
        const resolve = this.waitResolve;
        this.waitResolve = null;
        resolve({ value: undefined as unknown as VoiceStreamEvent, done: true });
      }
    });
  }

  /** Establish the WebSocket connection and authenticate. */
  static connect(token: VoiceStreamToken): Promise<VoiceStreamInstance> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(token.wsUrl);
      ws.binaryType = "arraybuffer";

      const onOpen = () => {
        cleanup();
        // Send auth token as first text message
        ws.send(token.authToken);
        resolve(new VoiceStreamInstance(ws));
      };

      const onError = () => {
        cleanup();
        reject(new Error("Failed to connect voice WebSocket"));
      };

      const cleanup = () => {
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
      };

      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
    });
  }

  /** Send a binary audio chunk to the server. */
  sendAudio(audio: Uint8Array | ArrayBuffer): void {
    this.ws.send(audio);
  }

  /** Signal the server that the user has finished speaking. */
  endOfSpeech(): void {
    this.ws.send(JSON.stringify({ type: "end_of_speech" }));
  }

  /** Change audio format, voice, or language mid-session. */
  configure(options: {
    audioFormat?: string;
    voiceName?: string;
    language?: string;
  }): void {
    const msg: Record<string, string> = { type: "config" };
    if (options.audioFormat) msg.audio_format = options.audioFormat;
    if (options.voiceName) msg.voice_name = options.voiceName;
    if (options.language) msg.language = options.language;
    this.ws.send(JSON.stringify(msg));
  }

  /** Close the voice stream. */
  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.ws.close();
    }
  }

  /** Async iterator for incoming events. */
  [Symbol.asyncIterator](): AsyncIterator<VoiceStreamEvent> {
    return {
      next: (): Promise<IteratorResult<VoiceStreamEvent>> => {
        if (this.eventQueue.length > 0) {
          return Promise.resolve({
            value: this.eventQueue.shift()!,
            done: false,
          });
        }
        if (this.closed) {
          return Promise.resolve({
            value: undefined as unknown as VoiceStreamEvent,
            done: true,
          });
        }
        return new Promise((resolve) => {
          this.waitResolve = resolve;
        });
      },
    };
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

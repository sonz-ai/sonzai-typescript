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
  VoiceListOptions,
  VoiceListResponse,
  VoiceStreamEvent,
  VoiceStreamToken,
  VoiceTokenOptions,
  TTSOptions,
  TTSResponse,
  STTOptions,
  STTResponse,
} from "../types.js";

/** Agent-scoped voice live operations (duplex WebSocket streaming via Gemini Live). */
export class Voice {
  constructor(private readonly http: HTTPClient) {}

  /**
   * Get a short-lived token for voice live WebSocket streaming.
   * The token expires in 60 seconds and is single-use.
   */
  async getToken(
    agentId: string,
    options: VoiceTokenOptions = {},
  ): Promise<VoiceStreamToken> {
    const body: Record<string, unknown> = {};
    if (options.voiceName) body.voiceName = options.voiceName;
    if (options.language) body.language = options.language;
    if (options.userId) body.userId = options.userId;
    if (options.compiledSystemPrompt)
      body.compiledSystemPrompt = options.compiledSystemPrompt;

    return this.http.post<VoiceStreamToken>(
      `/api/v1/agents/${agentId}/voice/live-ws-token`,
      body,
    );
  }

  /**
   * Open a bidirectional WebSocket for real-time voice chat via Gemini Live.
   *
   * @example
   * ```ts
   * const token = await client.agents.voice.getToken(agentId);
   * const stream = await client.agents.voice.stream(token);
   *
   * // Send PCM audio chunks (16kHz, 16-bit, mono)
   * stream.sendAudio(audioChunk);
   *
   * // Or send text input instead of audio
   * stream.sendText("Hello!");
   *
   * for await (const event of stream) {
   *   if (event.type === "input_transcript") console.log("User:", event.text);
   *   if (event.type === "output_transcript") console.log("Agent:", event.text);
   *   if (event.type === "audio") playPCMAudio(event.audio); // 24kHz PCM
   *   if (event.type === "turn_complete") console.log("Turn done");
   *   if (event.type === "session_ended") break;
   * }
   *
   * stream.close();
   * ```
   */
  async stream(token: VoiceStreamToken): Promise<VoiceStreamInstance> {
    return VoiceStreamInstance.connect(token);
  }

  /**
   * Convert text to speech audio.
   *
   * @example
   * ```ts
   * const result = await client.agents.voice.tts(agentId, {
   *   text: "Hello, how are you?",
   *   voiceName: "Kore",
   *   outputFormat: "wav",
   * });
   * // result.audio is base64-encoded WAV
   * ```
   */
  async tts(agentId: string, options: TTSOptions): Promise<TTSResponse> {
    const body: Record<string, unknown> = { text: options.text };
    if (options.voiceName) body.voiceName = options.voiceName;
    if (options.language) body.language = options.language;
    if (options.outputFormat) body.outputFormat = options.outputFormat;

    return this.http.post<TTSResponse>(
      `/api/v1/agents/${agentId}/voice/tts`,
      body,
    );
  }

  /**
   * Transcribe audio to text.
   *
   * @example
   * ```ts
   * const result = await client.agents.voice.stt(agentId, {
   *   audio: base64Audio,
   *   audioFormat: "audio/wav",
   *   language: "en-US",
   * });
   * console.log(result.transcript);
   * ```
   */
  async stt(agentId: string, options: STTOptions): Promise<STTResponse> {
    const body: Record<string, unknown> = {
      audio: options.audio,
      audioFormat: options.audioFormat,
    };
    if (options.language) body.language = options.language;

    return this.http.post<STTResponse>(
      `/api/v1/agents/${agentId}/voice/stt`,
      body,
    );
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
  // Named references so close() can detach them — otherwise the listeners'
  // closures keep the WebSocket reachable after close() and let late events
  // keep pushing onto eventQueue.
  private onMessage: (evt: { data: any }) => void;
  private onClose: () => void;
  private onError: (evt: any) => void;

  private constructor(ws: WebSocket) {
    this.ws = ws;

    ws.binaryType = "arraybuffer";

    this.onMessage = (evt) => {
      let event: VoiceStreamEvent;
      if (evt.data instanceof ArrayBuffer) {
        event = { type: "audio", audio: new Uint8Array(evt.data) };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any;
        try {
          parsed = JSON.parse(evt.data as string);
        } catch (err) {
          event = {
            type: "error",
            error: `malformed JSON from voice server: ${(err as Error).message}`,
          };
          if (this.waitResolve) {
            const resolve = this.waitResolve;
            this.waitResolve = null;
            resolve({ value: event, done: false });
          } else {
            this.eventQueue.push(event);
          }
          return;
        }
        event = {
          type: parsed.type ?? "",
          sessionId: parsed.sessionId ?? parsed.session_id,
          text: parsed.text,
          isFinal: parsed.isFinal,
          speaking: parsed.speaking,
          turnIndex: parsed.turnIndex,
          name: parsed.name,
          status: parsed.status,
          facts: parsed.facts,
          emotions: parsed.emotions,
          relationshipDelta: parsed.relationshipDelta,
          promptTokens: parsed.promptTokens,
          completionTokens: parsed.completionTokens,
          totalTokens: parsed.totalTokens,
          reason: parsed.reason,
          totalUsage: parsed.totalUsage,
          turnCount: parsed.turnCount,
          voiceName: parsed.voiceName,
          error: parsed.error,
          errorCode: parsed.errorCode ?? parsed.error_code ?? parsed.code,
        };
      }

      if (this.waitResolve) {
        const resolve = this.waitResolve;
        this.waitResolve = null;
        resolve({ value: event, done: false });
      } else {
        this.eventQueue.push(event);
      }
    };

    this.onClose = () => {
      this.closed = true;
      if (this.waitResolve) {
        const resolve = this.waitResolve;
        this.waitResolve = null;
        resolve({ value: undefined as unknown as VoiceStreamEvent, done: true });
      }
    };

    this.onError = () => {
      this.closed = true;
      if (this.waitResolve) {
        const resolve = this.waitResolve;
        this.waitResolve = null;
        resolve({ value: undefined as unknown as VoiceStreamEvent, done: true });
      }
    };

    ws.addEventListener("message", this.onMessage);
    ws.addEventListener("close", this.onClose);
    ws.addEventListener("error", this.onError);
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

  /** Send a text message to the agent instead of audio. */
  sendText(text: string): void {
    this.ws.send(JSON.stringify({ type: "text_input", text }));
  }

  /** Gracefully end the voice session. */
  endSession(): void {
    this.ws.send(JSON.stringify({ type: "end_session" }));
  }

  /** Change audio format or sample rate mid-session. */
  configure(options: {
    audioFormat?: string;
    sampleRate?: number;
  }): void {
    const msg: Record<string, unknown> = { type: "config" };
    if (options.audioFormat) msg.audioFormat = options.audioFormat;
    if (options.sampleRate) msg.sampleRate = options.sampleRate;
    this.ws.send(JSON.stringify(msg));
  }

  /** Close the voice stream. */
  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.ws.close();
    }
    // Detach listeners after close to release the WebSocket reference and
    // stop any late events from growing eventQueue. Safe to call twice.
    this.ws.removeEventListener("message", this.onMessage);
    this.ws.removeEventListener("close", this.onClose);
    this.ws.removeEventListener("error", this.onError);
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

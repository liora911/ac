"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RealtimeStartOptions {
  language?: string;
  prompt?: string;
}

interface UseRealtimeTranscriptionOptions {
  /** Hard cap on stream duration in ms. Defaults to 90s. */
  maxDurationMs?: number;
  /** Partial in-flight transcription chunks (rolling). */
  onDelta?: (delta: string) => void;
  /** A finalized utterance segment (server VAD boundary). */
  onFinalized?: (text: string) => void;
  onError?: (message: string) => void;
}

interface UseRealtimeTranscriptionReturn {
  isStreaming: boolean;
  isSupported: boolean;
  error: string | null;
  start: (stream: MediaStream, opts?: RealtimeStartOptions) => Promise<void>;
  stop: () => void;
}

const REALTIME_URL = "wss://api.openai.com/v1/realtime";
const TARGET_SAMPLE_RATE = 24000;
const CHUNK_MS = 40;
const DEFAULT_MAX_DURATION_MS = 90_000;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useRealtimeTranscription(
  options: UseRealtimeTranscriptionOptions = {}
): UseRealtimeTranscriptionReturn {
  const { maxDurationMs = DEFAULT_MAX_DURATION_MS } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.AudioContext !== "undefined" &&
    typeof window.AudioWorkletNode !== "undefined" &&
    typeof window.WebSocket !== "undefined";

  // Keep callbacks in refs so the returned start/stop identities are stable
  // and we always invoke the latest closures.
  const callbacksRef = useRef({
    onDelta: options.onDelta,
    onFinalized: options.onFinalized,
    onError: options.onError,
  });
  callbacksRef.current = {
    onDelta: options.onDelta,
    onFinalized: options.onFinalized,
    onError: options.onError,
  };

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const capTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const reportError = useCallback((message: string) => {
    setError(message);
    callbacksRef.current.onError?.(message);
  }, []);

  const cleanup = useCallback(() => {
    stoppedRef.current = true;

    if (capTimerRef.current) {
      clearTimeout(capTimerRef.current);
      capTimerRef.current = null;
    }

    const worklet = workletNodeRef.current;
    if (worklet) {
      try {
        worklet.port.postMessage("stop");
        worklet.port.onmessage = null;
        worklet.disconnect();
      } catch {
        // ignore
      }
      workletNodeRef.current = null;
    }

    const source = sourceNodeRef.current;
    if (source) {
      try {
        source.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }

    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {});
    }
    audioCtxRef.current = null;

    const ws = wsRef.current;
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        }
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        ) {
          ws.close(1000, "client stop");
        }
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    setIsStreaming(false);
  }, []);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const start = useCallback(
    async (stream: MediaStream, opts: RealtimeStartOptions = {}) => {
      if (!isSupported) {
        reportError("Realtime transcription not supported in this browser.");
        return;
      }
      // Defensive: if already running, tear down first.
      cleanup();
      stoppedRef.current = false;
      setError(null);

      let tokenRes: Response;
      try {
        tokenRes = await fetch("/api/transcribe/realtime-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: opts.language,
            prompt: opts.prompt,
          }),
        });
      } catch (err) {
        reportError(
          err instanceof Error ? err.message : "Failed to reach session API."
        );
        return;
      }

      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        reportError(
          (body as { error?: string }).error ||
            `Session mint failed: ${tokenRes.status}`
        );
        return;
      }

      const session = (await tokenRes.json()) as { token?: string };
      if (!session.token) {
        reportError("Session response missing token.");
        return;
      }

      // If user already stopped while we were minting, bail.
      if (stoppedRef.current) return;

      let ws: WebSocket;
      try {
        // GA Realtime API: browser auth via subprotocol with the ephemeral
        // client_secret value. No more openai-beta subprotocol.
        ws = new WebSocket(REALTIME_URL, [
          "realtime",
          `openai-insecure-api-key.${session.token}`,
        ]);
      } catch (err) {
        reportError(
          err instanceof Error ? err.message : "Failed to open WebSocket."
        );
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        // The session is fully configured by the server mint, so we don't
        // strictly need to update it here. Left intentionally empty.
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        let msg: {
          type?: string;
          delta?: string;
          transcript?: string;
          error?: { message?: string };
        };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        const type = msg.type || "";
        if (type === "error") {
          reportError(msg.error?.message || "Realtime stream error.");
          return;
        }
        // Be resilient to GA event-name churn: any event whose type contains
        // "transcription" and carries a delta / transcript gets treated as such.
        if (type.includes("transcription")) {
          if (type.endsWith(".delta") && msg.delta) {
            callbacksRef.current.onDelta?.(msg.delta);
            return;
          }
          if (
            (type.endsWith(".completed") || type.endsWith(".done")) &&
            msg.transcript
          ) {
            callbacksRef.current.onFinalized?.(msg.transcript);
            return;
          }
        }
        // Surface unknown event types so we can spot GA renames.
        if (process.env.NODE_ENV !== "production") {
          console.debug("[realtime] event:", type, msg);
        }
      };

      ws.onerror = () => {
        reportError("Realtime WebSocket error.");
      };

      ws.onclose = () => {
        if (!stoppedRef.current) {
          // Unexpected close mid-stream — surface a soft error but don't throw.
          reportError("Realtime stream closed unexpectedly.");
        }
        setIsStreaming(false);
      };

      // Set up the audio pipeline.
      let ctx: AudioContext;
      try {
        const Ctor: typeof AudioContext =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new Ctor();
      } catch (err) {
        reportError(
          err instanceof Error
            ? err.message
            : "Failed to initialize AudioContext."
        );
        cleanup();
        return;
      }
      audioCtxRef.current = ctx;

      try {
        await ctx.audioWorklet.addModule("/worklets/pcm-capture-worklet.js");
      } catch (err) {
        reportError(
          err instanceof Error ? err.message : "Failed to load audio worklet."
        );
        cleanup();
        return;
      }

      if (stoppedRef.current) {
        cleanup();
        return;
      }

      const sourceNode = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const workletNode = new AudioWorkletNode(ctx, "pcm-capture-processor", {
        processorOptions: {
          targetSampleRate: TARGET_SAMPLE_RATE,
          chunkMs: CHUNK_MS,
        },
      });
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const buf = event.data as ArrayBuffer;
        const audio = arrayBufferToBase64(buf);
        ws.send(
          JSON.stringify({ type: "input_audio_buffer.append", audio })
        );
      };

      sourceNode.connect(workletNode);
      // Intentionally not connected to destination — we don't want a feedback loop.

      capTimerRef.current = setTimeout(() => {
        reportError("Realtime stream hit duration cap.");
        cleanup();
      }, maxDurationMs);

      setIsStreaming(true);
    },
    [cleanup, isSupported, maxDurationMs, reportError]
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { isStreaming, isSupported, error, start, stop };
}

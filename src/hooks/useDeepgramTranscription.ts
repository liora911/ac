"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DeepgramStartOptions {
  /** "he" | "en" | "auto" — auto maps to Nova-3 multilingual */
  language?: string;
  prompt?: string;
}

interface UseDeepgramTranscriptionOptions {
  /** Hard cap on stream duration in ms. Defaults to 90s. */
  maxDurationMs?: number;
  /**
   * Rolling current-segment partial transcript. Callers should REPLACE
   * their current preview slice with this, not append.
   */
  onPartial?: (text: string) => void;
  /** A finalized segment (Deepgram is_final = true). */
  onFinalized?: (text: string) => void;
  onError?: (message: string) => void;
}

interface UseDeepgramTranscriptionReturn {
  isStreaming: boolean;
  isSupported: boolean;
  error: string | null;
  start: (stream: MediaStream, opts?: DeepgramStartOptions) => Promise<void>;
  stop: () => void;
}

const DEEPGRAM_URL = "wss://api.deepgram.com/v1/listen";
const TARGET_SAMPLE_RATE = 24000;
const CHUNK_MS = 20;
const DEFAULT_MAX_DURATION_MS = 90_000;

function buildDeepgramUrl(model: string, language?: string): string {
  const params = new URLSearchParams({
    model,
    encoding: "linear16",
    sample_rate: String(TARGET_SAMPLE_RATE),
    channels: "1",
    interim_results: "true",
    endpointing: "200",
    punctuate: "true",
    smart_format: "true",
    no_delay: "true",
  });
  // language=multi tells Nova-3 to auto-detect; otherwise pin the ISO code.
  params.set("language", language && language !== "auto" ? language : "multi");
  return `${DEEPGRAM_URL}?${params.toString()}`;
}

export function useDeepgramTranscription(
  options: UseDeepgramTranscriptionOptions = {}
): UseDeepgramTranscriptionReturn {
  const { maxDurationMs = DEFAULT_MAX_DURATION_MS } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.AudioContext !== "undefined" &&
    typeof window.AudioWorkletNode !== "undefined" &&
    typeof window.WebSocket !== "undefined";

  const callbacksRef = useRef({
    onPartial: options.onPartial,
    onFinalized: options.onFinalized,
    onError: options.onError,
  });
  callbacksRef.current = {
    onPartial: options.onPartial,
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
          // CloseStream tells Deepgram to flush + close gracefully.
          ws.send(JSON.stringify({ type: "CloseStream" }));
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
    async (stream: MediaStream, opts: DeepgramStartOptions = {}) => {
      if (!isSupported) {
        reportError("Deepgram streaming not supported in this browser.");
        return;
      }
      cleanup();
      stoppedRef.current = false;
      setError(null);

      let tokenRes: Response;
      try {
        tokenRes = await fetch("/api/transcribe/deepgram-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch (err) {
        reportError(
          err instanceof Error ? err.message : "Failed to reach token API."
        );
        return;
      }

      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        reportError(
          (body as { error?: string }).error ||
            `Token grant failed: ${tokenRes.status}`
        );
        return;
      }

      const grant = (await tokenRes.json()) as {
        token?: string;
        model?: string;
      };
      if (!grant.token) {
        reportError("Token response missing value.");
        return;
      }
      if (stoppedRef.current) return;

      const model = grant.model || "nova-3";
      const url = buildDeepgramUrl(model, opts.language);

      let ws: WebSocket;
      try {
        // Deepgram browser auth: subprotocol ["token", "<access_token>"].
        ws = new WebSocket(url, ["token", grant.token]);
        ws.binaryType = "arraybuffer";
      } catch (err) {
        reportError(
          err instanceof Error ? err.message : "Failed to open WebSocket."
        );
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        // No init message required — config is in the URL params.
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        let msg: {
          type?: string;
          channel?: { alternatives?: Array<{ transcript?: string }> };
          is_final?: boolean;
          speech_final?: boolean;
          error?: { message?: string };
          reason?: string;
        };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type === "Results") {
          const transcript =
            msg.channel?.alternatives?.[0]?.transcript?.trim() || "";
          if (!transcript) return;
          if (msg.is_final) {
            callbacksRef.current.onFinalized?.(transcript);
          } else {
            callbacksRef.current.onPartial?.(transcript);
          }
          return;
        }
        if (msg.type === "Error" || msg.type === "Warning") {
          reportError(msg.reason || msg.error?.message || "Deepgram error.");
          return;
        }
        // Metadata / SpeechStarted / UtteranceEnd — informational, ignore.
        if (process.env.NODE_ENV !== "production") {
          console.debug("[deepgram] event:", msg.type, msg);
        }
      };

      ws.onerror = () => {
        reportError("Deepgram WebSocket error.");
      };

      ws.onclose = (event) => {
        if (!stoppedRef.current) {
          reportError(
            `Deepgram stream closed (${event.code}${
              event.reason ? `: ${event.reason}` : ""
            }).`
          );
        }
        setIsStreaming(false);
      };

      // Set up the audio pipeline (reuses the same worklet as the OpenAI path).
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
        const sock = wsRef.current;
        if (!sock || sock.readyState !== WebSocket.OPEN) return;
        // Deepgram accepts raw PCM16 as binary frames — no base64 wrapping.
        sock.send(event.data as ArrayBuffer);
      };

      sourceNode.connect(workletNode);

      capTimerRef.current = setTimeout(() => {
        reportError("Deepgram stream hit duration cap.");
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

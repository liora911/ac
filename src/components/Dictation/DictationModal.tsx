"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Volume2,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import { useRealtimeTranscription } from "@/hooks/useRealtimeTranscription";
import type {
  DictationLanguage,
  DictationModalProps,
  DictationPhase,
  SuggestResponse,
  TranscribeErrorResponse,
  TranscribeResponse,
  TranscriptSuggestion,
} from "@/types/Editor/dictation";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function DictationModal({
  isOpen,
  onClose,
  onApprove,
  defaultLanguage = "auto",
  contextHint,
}: DictationModalProps) {
  const { t, locale } = useTranslation();
  const { showError, showSuccess } = useNotification();

  const [phase, setPhase] = useState<DictationPhase>("idle");
  const [language, setLanguage] = useState<DictationLanguage>(defaultLanguage);
  const [polish, setPolish] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPolished, setIsPolished] = useState(false);
  const [livePreview, setLivePreview] = useState("");
  const [suggestions, setSuggestions] = useState<TranscriptSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestDone, setSuggestDone] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");
  const finalLiveRef = useRef<string>("");
  const currentDeltaRef = useRef<string>("");
  const livePreviewRef = useRef<HTMLDivElement | null>(null);

  const {
    start: startRealtime,
    stop: stopRealtime,
    isSupported: realtimeSupported,
  } = useRealtimeTranscription({
    onDelta: (delta) => {
      currentDeltaRef.current += delta;
      const combined =
        `${finalLiveRef.current} ${currentDeltaRef.current}`.trim();
      setLivePreview(combined);
    },
    onFinalized: (text) => {
      finalLiveRef.current = `${finalLiveRef.current} ${text}`.trim();
      currentDeltaRef.current = "";
      setLivePreview(finalLiveRef.current);
    },
    onError: (message) => {
      console.warn("Realtime preview:", message);
    },
  });

  const supported = useMemo(
    () =>
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined",
    []
  );

  const cleanupAudioGraph = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const teardown = useCallback(() => {
    stopTimer();
    cleanupAudioGraph();
    releaseStream();
    stopRealtime();
    recorderRef.current = null;
    chunksRef.current = [];
  }, [stopTimer, cleanupAudioGraph, releaseStream, stopRealtime]);

  const resetState = useCallback(() => {
    setPhase("idle");
    setElapsedMs(0);
    setAmplitude(0);
    setTranscript("");
    setErrorMsg(null);
    setIsPolished(false);
    setLivePreview("");
    setSuggestions([]);
    setSuggestLoading(false);
    setSuggestDone(false);
    finalLiveRef.current = "";
    currentDeltaRef.current = "";
    accumulatedMsRef.current = 0;
    startedAtRef.current = 0;
  }, []);

  // Keep the live preview pinned to the latest text so the speaker doesn't
  // have to scroll to follow their own words.
  useEffect(() => {
    const node = livePreviewRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [livePreview]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      resetState();
      setLanguage(defaultLanguage);
    } else {
      teardown();
      resetState();
    }
    return () => {
      teardown();
    };
  }, [isOpen, defaultLanguage, resetState, teardown]);

  const startAmplitudeTracking = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buffer.length);
        setAmplitude(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn("Amplitude tracking unavailable:", err);
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(
        accumulatedMsRef.current + (Date.now() - startedAtRef.current)
      );
    }, 200);
  }, [stopTimer]);

  const startRecording = useCallback(async () => {
    if (!supported) {
      setPhase("error");
      setErrorMsg(t("dictation.notSupported"));
      return;
    }
    try {
      setPhase("requesting-permission");
      setErrorMsg(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mime = pickSupportedMimeType();
      mimeTypeRef.current = mime;
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      startAmplitudeTracking(stream);
      accumulatedMsRef.current = 0;
      startTimer();
      finalLiveRef.current = "";
      currentDeltaRef.current = "";
      setLivePreview("");
      if (realtimeSupported) {
        startRealtime(stream, {
          language: language === "auto" ? undefined : language,
          prompt: contextHint,
        }).catch(() => {
          // Errors are surfaced via onError; recording still proceeds.
        });
      }
      setPhase("recording");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      console.error("getUserMedia failed:", err);
      setPhase("error");
      setErrorMsg(
        name === "NotAllowedError" || name === "SecurityError"
          ? t("dictation.micPermissionDenied")
          : t("dictation.micUnavailable")
      );
      teardown();
    }
  }, [
    supported,
    t,
    startAmplitudeTracking,
    startTimer,
    teardown,
    realtimeSupported,
    startRealtime,
    language,
    contextHint,
  ]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    stopTimer();
    stopRealtime();
    accumulatedMsRef.current += Date.now() - startedAtRef.current;
    setPhase("paused");
  }, [stopTimer, stopRealtime]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    startTimer();
    if (realtimeSupported && streamRef.current) {
      startRealtime(streamRef.current, {
        language: language === "auto" ? undefined : language,
        prompt: contextHint,
      }).catch(() => {
        // Errors are surfaced via onError; recording still proceeds.
      });
    }
    setPhase("recording");
  }, [startTimer, realtimeSupported, startRealtime, language, contextHint]);

  // Runs in the background after transcription; failures degrade silently —
  // the transcript itself is never blocked by the suggestion pass
  const fetchSuggestions = useCallback(async (text: string) => {
    setSuggestLoading(true);
    setSuggestDone(false);
    setSuggestions([]);
    try {
      const res = await fetch("/api/transcribe/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Suggest failed: ${res.status}`);
      const data = (await res.json()) as SuggestResponse;
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.warn("Suggestion pass failed:", err);
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
      setSuggestDone(true);
    }
  }, []);

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      setPhase("transcribing");
      try {
        const formData = new FormData();
        const ext = (mimeTypeRef.current.split(";")[0].split("/")[1] || "webm").replace(
          "mpeg",
          "mp3"
        );
        formData.append("audio", blob, `dictation.${ext}`);
        formData.append("language", language);
        formData.append("polish", polish ? "true" : "false");
        if (contextHint) {
          formData.append("prompt", contextHint.slice(0, 500));
        }

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as TranscribeErrorResponse;
          throw new Error(err.error || t("dictation.transcribeFailed"));
        }

        const data = (await res.json()) as TranscribeResponse;
        // Append to what was already transcribed in earlier takes — the
        // author dictates continuously in the same canvas
        const combined = transcript.trim()
          ? `${transcript.trim()}\n\n${data.text}`
          : data.text;
        setTranscript(combined);
        setIsPolished(data.polished);
        setLivePreview("");
        setPhase("review");
        fetchSuggestions(combined);
      } catch (err) {
        console.error("Transcription error:", err);
        setPhase("error");
        setErrorMsg(
          err instanceof Error ? err.message : t("dictation.transcribeFailed")
        );
      }
    },
    [language, polish, contextHint, t, fetchSuggestions, transcript]
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || (recorder.state !== "recording" && recorder.state !== "paused")) {
      return;
    }
    stopTimer();
    stopRealtime();
    if (recorder.state === "recording") {
      accumulatedMsRef.current += Date.now() - startedAtRef.current;
    }

    recorder.onstop = () => {
      const mime = mimeTypeRef.current || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      cleanupAudioGraph();
      releaseStream();
      if (blob.size === 0) {
        setPhase("error");
        setErrorMsg(t("dictation.emptyRecording"));
        return;
      }
      transcribeBlob(blob);
    };
    recorder.stop();
  }, [stopTimer, cleanupAudioGraph, releaseStream, transcribeBlob, t, stopRealtime]);

  const handleClose = useCallback(() => {
    teardown();
    resetState();
    onClose();
  }, [teardown, resetState, onClose]);

  const handleApprove = useCallback(() => {
    const cleaned = transcript.trim();
    if (!cleaned) {
      showError(t("dictation.emptyTranscript"));
      return;
    }
    onApprove(cleaned);
    showSuccess(t("dictation.inserted"));
    // Stay in the modal, ready for the next dictation — the author often
    // dictates an article in several passes
    teardown();
    resetState();
  }, [transcript, onApprove, teardown, resetState, showError, showSuccess, t]);

  const applySuggestion = useCallback(
    (suggestion: TranscriptSuggestion) => {
      setTranscript((prev) => prev.replace(suggestion.original, suggestion.suggested));
      setSuggestions((prev) => prev.filter((s) => s !== suggestion));
    },
    []
  );

  const dismissSuggestion = useCallback((suggestion: TranscriptSuggestion) => {
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  }, []);

  const applyAllSuggestions = useCallback(() => {
    setTranscript((prev) => {
      let next = prev;
      for (const s of suggestions) {
        if (next.includes(s.original)) {
          next = next.replace(s.original, s.suggested);
        }
      }
      return next;
    });
    setSuggestions([]);
  }, [suggestions]);

  const handleRerecord = useCallback(() => {
    teardown();
    resetState();
  }, [teardown, resetState]);

  // Keyboard shortcut: Space toggles record/stop when not typing
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable);
      if (e.key === "Escape") {
        if (phase === "recording" || phase === "paused") {
          e.preventDefault();
          stopRecording();
        } else if (phase !== "transcribing") {
          handleClose();
        }
        return;
      }
      if (e.key === " " && !isTyping) {
        if (phase === "idle" || phase === "error" || phase === "review") {
          e.preventDefault();
          startRecording();
        } else if (phase === "recording") {
          e.preventDefault();
          stopRecording();
        } else if (phase === "paused") {
          e.preventDefault();
          resumeRecording();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, phase, startRecording, stopRecording, resumeRecording, handleClose]);

  if (!isOpen) return null;

  const dir = locale === "he" ? "rtl" : "ltr";
  const isBusy = phase === "transcribing" || phase === "requesting-permission";
  const settingsDisabled =
    phase === "recording" || phase === "paused" || isBusy;

  return (
    <AnimatePresence>
      <motion.div
        key="dictation-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4"
        onClick={handleClose}
        role="presentation"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dictation-title"
          dir={dir}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  id="dictation-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-50 leading-tight"
                >
                  {t("dictation.title")}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">
                  {t("dictation.subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              title={t("dictation.tooltip.close")}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t("dictation.close")}
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Status + settings bar — visible in every phase except transcribing/error */}
          {phase !== "transcribing" && phase !== "error" && (
            <div className="flex items-center flex-wrap gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-40">
                  <WaveformVisualizer
                    amplitude={amplitude}
                    active={phase === "recording"}
                  />
                </div>
                <div className="tabular-nums text-2xl font-light text-gray-900 dark:text-gray-100 min-w-[4rem]">
                  {formatDuration(elapsedMs)}
                </div>
                <div className="min-w-[7rem]">
                  {phase === "recording" && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {t("dictation.recording")}
                    </div>
                  )}
                  {phase === "paused" && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-500">
                      <Pause className="w-3.5 h-3.5" />
                      {t("dictation.paused")}
                    </div>
                  )}
                  {phase === "requesting-permission" && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {t("dictation.requestingPermission")}
                    </div>
                  )}
                  {phase === "idle" && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Volume2 className="w-3.5 h-3.5" />
                      {t("dictation.readyHint")}
                    </div>
                  )}
                  {phase === "review" && isPolished && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t("dictation.polished")}
                    </div>
                  )}
                </div>
              </div>

              <div className="ms-auto flex items-center gap-5">
                <div
                  className="flex items-center gap-2"
                  title={t("dictation.tooltip.language")}
                >
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("dictation.language")}
                  </label>
                  <select
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value as DictationLanguage)
                    }
                    disabled={settingsDisabled}
                    className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                  >
                    <option value="auto">{t("dictation.languageAuto")}</option>
                    <option value="he">{t("dictation.languageHe")}</option>
                    <option value="en">{t("dictation.languageEn")}</option>
                  </select>
                </div>

                <label
                  className="flex items-center gap-2 cursor-pointer select-none"
                  title={t("dictation.tooltip.polish")}
                >
                  <input
                    type="checkbox"
                    checked={polish}
                    onChange={(e) => setPolish(e.target.checked)}
                    disabled={settingsDisabled}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t("dictation.polish")}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Main content — dominant text panel */}
          <div className="flex-1 min-h-0 p-6 flex flex-col overflow-hidden">
            {phase === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-xl font-medium text-gray-900 dark:text-gray-100">
                  {t("dictation.readyHint")}
                </p>
              </div>
            )}

            {phase === "requesting-permission" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-14 h-14 animate-spin text-blue-500" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t("dictation.requestingPermission")}
                </p>
              </div>
            )}

            {(phase === "recording" ||
              phase === "paused" ||
              phase === "transcribing") && (
              <div
                ref={livePreviewRef}
                dir="auto"
                className="flex-1 min-h-0 overflow-y-auto px-8 py-6 rounded-xl bg-gray-50 dark:bg-gray-800/60 border-2 border-dashed border-gray-200 dark:border-gray-700 text-2xl leading-relaxed"
                aria-live="polite"
              >
                {/* Text confirmed by earlier transcription passes — solid */}
                {transcript && (
                  <span className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                    {transcript}{" "}
                  </span>
                )}
                {/* Words still waiting for Whisper — greyish, in place */}
                {livePreview ? (
                  <span
                    className={`italic text-gray-400 dark:text-gray-500 ${
                      phase === "transcribing" ? "animate-pulse" : ""
                    }`}
                  >
                    {livePreview}
                  </span>
                ) : (
                  !transcript &&
                  phase !== "transcribing" && (
                    <span className="text-gray-400 dark:text-gray-500">
                      {t("dictation.speakToSeePreview")}
                    </span>
                  )
                )}
                {phase === "recording" && (
                  <span className="ms-1 inline-block w-1.5 h-7 align-middle bg-gray-400 dark:bg-gray-500 animate-pulse" />
                )}
                {phase === "transcribing" && (
                  <span className="ms-3 inline-flex items-center gap-2 align-middle not-italic text-base font-medium text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("dictation.transcribing")}
                  </span>
                )}
              </div>
            )}

            {phase === "error" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t("dictation.somethingWentWrong")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  {errorMsg || t("dictation.unknownError")}
                </p>
              </div>
            )}

            {phase === "review" && (
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
                {/* Transcript editor — same canvas the live preview used,
                    now editable with the confirmed text */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    dir="auto"
                    className="w-full flex-1 min-h-[200px] lg:min-h-0 px-8 py-6 text-2xl bg-gray-50 dark:bg-gray-800/60 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                    placeholder={t("dictation.reviewPlaceholder")}
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t("dictation.reviewHint")}
                  </p>
                </div>

                {/* Suggested fixes panel */}
                {(suggestLoading || suggestions.length > 0 || suggestDone) && (
                  <div className="w-full lg:w-96 flex-shrink-0 min-h-0 flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {t("dictation.suggestionsTitle")}
                        {suggestions.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            {suggestions.length}
                          </span>
                        )}
                      </span>
                      {suggestions.length > 1 && (
                        <button
                          type="button"
                          onClick={applyAllSuggestions}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          {t("dictation.applyAll")}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
                      {suggestLoading ? (
                        <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-500 dark:text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("dictation.suggestionsLoading")}
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-500 dark:text-gray-400">
                          <Check className="w-4 h-4 text-green-500" />
                          {t("dictation.suggestionsNone")}
                        </div>
                      ) : (
                        suggestions.map((s, idx) => {
                          const stillFound = transcript.includes(s.original);
                          return (
                            <div
                              key={`${idx}-${s.original.slice(0, 24)}`}
                              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                            >
                              <div dir="auto" className="text-sm leading-relaxed">
                                <span className="px-1 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through decoration-red-400/60">
                                  {s.original}
                                </span>
                              </div>
                              <div dir="auto" className="mt-1.5 text-sm leading-relaxed">
                                <span className="px-1 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                                  {s.suggested}
                                </span>
                              </div>
                              {s.reason && (
                                <p
                                  dir="auto"
                                  className="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                                >
                                  {s.reason}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => applySuggestion(s)}
                                  disabled={!stillFound}
                                  title={
                                    stillFound
                                      ? t("dictation.applySuggestion")
                                      : t("dictation.suggestionOutdated")
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Check className="w-3 h-3" />
                                  {t("dictation.applySuggestion")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => dismissSuggestion(s)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  {t("dictation.dismissSuggestion")}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions — all buttons consolidated here, every button gets a tooltip */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/50 shrink-0">
            {(phase === "idle" || phase === "error") && (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  title={t("dictation.tooltip.cancel")}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("dictation.cancel")}
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!supported}
                  title={t("dictation.tooltip.startRecording")}
                  className="ms-auto flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-base font-medium transition-colors shadow-sm"
                >
                  <Mic className="w-5 h-5" />
                  {phase === "error"
                    ? t("dictation.tryAgain")
                    : t("dictation.startRecording")}
                </button>
              </>
            )}

            {phase === "requesting-permission" && (
              <button
                type="button"
                onClick={handleClose}
                title={t("dictation.tooltip.cancel")}
                className="ms-auto px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t("dictation.cancel")}
              </button>
            )}

            {(phase === "recording" || phase === "paused") && (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  title={t("dictation.tooltip.cancel")}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("dictation.cancel")}
                </button>
                <div className="ms-auto flex items-center gap-3">
                  {phase === "recording" ? (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      title={t("dictation.tooltip.pause")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      {t("dictation.pause")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      title={t("dictation.tooltip.resume")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {t("dictation.resume")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopRecording}
                    title={t("dictation.tooltip.stopAndTranscribe")}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-medium transition-colors shadow-sm"
                  >
                    <Square className="w-4 h-4" />
                    {t("dictation.stopAndTranscribe")}
                  </button>
                </div>
              </>
            )}

            {phase === "transcribing" && (
              <button
                type="button"
                disabled
                className="ms-auto flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 text-sm font-medium cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("dictation.processing")}
              </button>
            )}

            {phase === "review" && (
              <>
                <button
                  type="button"
                  onClick={handleRerecord}
                  title={t("dictation.tooltip.recordAgain")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("dictation.recordAgain")}
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  title={t("dictation.continueRecording")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
                >
                  <Mic className="w-4 h-4" />
                  {t("dictation.continueRecording")}
                </button>
                <div className="ms-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    title={t("dictation.tooltip.discardTranscript")}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t("dictation.discard")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!transcript.trim()}
                    title={t("dictation.tooltip.insertIntoArticle")}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-base font-medium transition-colors shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                    {t("dictation.insert")}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function WaveformVisualizer({
  amplitude,
  active,
}: {
  amplitude: number;
  active: boolean;
}) {
  const bars = 24;
  const seed = useRef<number[]>(
    Array.from({ length: bars }, (_, i) => 0.3 + (i % 5) * 0.12)
  );

  return (
    <div className="flex items-end gap-0.5 h-10 w-full">
      {seed.current.map((base, i) => {
        const distance = Math.abs(i - bars / 2) / (bars / 2);
        const factor = 1 - distance * 0.4;
        const live = active ? amplitude * factor : 0;
        const height = Math.max(0.1, base * 0.2 + live * 0.9);
        return (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-100 ${
              active
                ? "bg-gradient-to-t from-blue-500 to-indigo-500"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
            style={{
              height: `${Math.min(100, height * 100)}%`,
              opacity: active ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}

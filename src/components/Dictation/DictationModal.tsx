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
import type {
  DictationLanguage,
  DictationModalProps,
  DictationPhase,
  TranscribeErrorResponse,
  TranscribeResponse,
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
    recorderRef.current = null;
    chunksRef.current = [];
  }, [stopTimer, cleanupAudioGraph, releaseStream]);

  const resetState = useCallback(() => {
    setPhase("idle");
    setElapsedMs(0);
    setAmplitude(0);
    setTranscript("");
    setErrorMsg(null);
    setIsPolished(false);
    accumulatedMsRef.current = 0;
    startedAtRef.current = 0;
  }, []);

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
  }, [supported, t, startAmplitudeTracking, startTimer, teardown]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    stopTimer();
    accumulatedMsRef.current += Date.now() - startedAtRef.current;
    setPhase("paused");
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    startTimer();
    setPhase("recording");
  }, [startTimer]);

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
        setTranscript(data.text);
        setIsPolished(data.polished);
        setPhase("review");
      } catch (err) {
        console.error("Transcription error:", err);
        setPhase("error");
        setErrorMsg(
          err instanceof Error ? err.message : t("dictation.transcribeFailed")
        );
      }
    },
    [language, polish, contextHint, t]
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || (recorder.state !== "recording" && recorder.state !== "paused")) {
      return;
    }
    stopTimer();
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
  }, [stopTimer, cleanupAudioGraph, releaseStream, transcribeBlob, t]);

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
    handleClose();
  }, [transcript, onApprove, handleClose, showError, showSuccess, t]);

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
        if (phase === "idle" || phase === "error") {
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
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dictation-title"
          dir={dir}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  id="dictation-title"
                  className="text-base font-semibold text-gray-900 dark:text-gray-50 leading-tight"
                >
                  {t("dictation.title")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {t("dictation.subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t("dictation.close")}
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex-1 overflow-y-auto">
            {/* Language + Polish toggle row — hide once in review */}
            {phase !== "review" && (
              <div className="flex items-center flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("dictation.language")}
                  </label>
                  <select
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value as DictationLanguage)
                    }
                    disabled={phase === "recording" || phase === "paused" || isBusy}
                    className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                  >
                    <option value="auto">{t("dictation.languageAuto")}</option>
                    <option value="he">{t("dictation.languageHe")}</option>
                    <option value="en">{t("dictation.languageEn")}</option>
                  </select>
                </div>

                <label className="ms-auto flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={polish}
                    onChange={(e) => setPolish(e.target.checked)}
                    disabled={phase === "recording" || phase === "paused" || isBusy}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {t("dictation.polish")}
                  </span>
                </label>
              </div>
            )}

            {/* Phase content */}
            {(phase === "idle" ||
              phase === "requesting-permission" ||
              phase === "recording" ||
              phase === "paused") && (
              <div className="flex flex-col items-center py-6">
                <WaveformVisualizer
                  amplitude={amplitude}
                  active={phase === "recording"}
                />
                <div className="mt-4 tabular-nums text-3xl font-light text-gray-900 dark:text-gray-100">
                  {formatDuration(elapsedMs)}
                </div>
                <div className="mt-2 h-5">
                  {phase === "recording" && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {t("dictation.recording")}
                    </div>
                  )}
                  {phase === "paused" && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                      <Pause className="w-3 h-3" />
                      {t("dictation.paused")}
                    </div>
                  )}
                  {phase === "requesting-permission" && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("dictation.requestingPermission")}
                    </div>
                  )}
                  {phase === "idle" && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Volume2 className="w-3 h-3" />
                      {t("dictation.readyHint")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase === "transcribing" && (
              <div className="flex flex-col items-center py-10">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t("dictation.transcribing")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("dictation.transcribingHint")}
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {t("dictation.somethingWentWrong")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                  {errorMsg || t("dictation.unknownError")}
                </p>
              </div>
            )}

            {phase === "review" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t("dictation.reviewLabel")}
                  {isPolished && (
                    <span className="ms-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-3 h-3" />
                      {t("dictation.polished")}
                    </span>
                  )}
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={9}
                  dir="auto"
                  className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
                  placeholder={t("dictation.reviewPlaceholder")}
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("dictation.reviewHint")}
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
            {(phase === "idle" || phase === "error") && (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("dictation.cancel")}
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!supported}
                  className="ms-auto flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-sm"
                >
                  <Mic className="w-4 h-4" />
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
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("dictation.cancel")}
                </button>
                <div className="ms-auto flex items-center gap-2">
                  {phase === "recording" ? (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      {t("dictation.pause")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {t("dictation.resume")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
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
                className="ms-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 text-sm font-medium cursor-not-allowed"
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("dictation.recordAgain")}
                </button>
                <div className="ms-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t("dictation.discard")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!transcript.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
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
    <div className="flex items-end gap-1 h-20 w-full max-w-xs">
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

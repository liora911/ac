import { useState, useRef, useEffect, useCallback } from "react";
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
} from "@/types/Editor/speech-recognition";

interface UseSpeechToTextOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { lang = "he-IL", continuous = false, onResult, onFinalResult } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Call onResult with interim results
      if (interimTranscript && onResult) {
        onResult(interimTranscript);
      }

      // Call onFinalResult with final transcript
      if (finalTranscript && onFinalResult) {
        onFinalResult(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, continuous, onResult, onFinalResult]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

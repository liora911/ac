export type DictationLanguage = "auto" | "he" | "en";

export interface DictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (text: string) => void;
  defaultLanguage?: DictationLanguage;
  /**
   * Optional context prompt sent to the transcription model to bias
   * recognition toward specific vocabulary (e.g. article title/topic).
   */
  contextHint?: string;
}

export interface TranscribeResponse {
  text: string;
  raw: string;
  polished: boolean;
  model: string;
}

export interface TranscribeErrorResponse {
  error: string;
  retryAfter?: number;
}

export type DictationPhase =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "paused"
  | "transcribing"
  | "review"
  | "error";

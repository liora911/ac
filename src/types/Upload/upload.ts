/**
 * Props for the DragDropImageUpload component.
 */
export interface DragDropImageUploadProps {
  onImageSelect: (url: string | null) => void;
  currentImage?: string | null;
  label?: string;
  placeholder?: string;
  onError?: (message: string) => void;
}

/**
 * Result type for client-side upload operations.
 */
export type ClientUploadResult =
  | { success: true; url: string; filename: string }
  | { success: false; error: string };

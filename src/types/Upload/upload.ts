export interface DragDropImageUploadProps {
  onImageSelect: (url: string | null) => void;
  currentImage?: string | null;
  label?: string;
  placeholder?: string;
  onError?: (message: string) => void;
}

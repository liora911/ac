// Archive media types
export type ArchiveMediaType = "NONE" | "IMAGE" | "VIDEO";

// Archive item from database
export interface Archive {
  id: string;
  title: string;
  content: string; // HTML content from TipTap editor
  mediaUrl: string | null;
  mediaType: ArchiveMediaType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Form data for creating/editing archive items
export interface ArchiveFormData {
  title: string;
  content: string;
  mediaUrl: string;
  mediaType: ArchiveMediaType;
}

// API request body for creating archive
export interface CreateArchiveRequest {
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType: ArchiveMediaType;
}

// API request body for updating archive
export interface UpdateArchiveRequest {
  title?: string;
  content?: string;
  mediaUrl?: string | null;
  mediaType?: ArchiveMediaType;
  order?: number;
}

// Props for Archive components
export interface ArchiveItemProps {
  archive: Archive;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (archive: Archive) => void;
  onDelete: (id: string) => void;
}

export interface ArchiveFormProps {
  archive?: Archive;
  onSubmit: (data: ArchiveFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

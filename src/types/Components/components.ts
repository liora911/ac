import type { ReactNode } from "react";
import type { FavoriteType } from "@/hooks/useFavorites";

// ============================================
// UTILITY COMPONENT PROPS
// ============================================

/**
 * Props for the FavoriteButton component.
 * Used for toggling favorite status on content items.
 */
export interface FavoriteButtonProps {
  itemId: string;
  itemType: FavoriteType;
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

/**
 * Props for the PremiumBadge component.
 * Displays premium status indicator with optional tooltip.
 */
export interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  variant?: "star" | "badge" | "crown";
  showTooltip?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Props for the PremiumTag component (inline compact badge).
 */
export interface PremiumTagProps {
  className?: string;
}

/**
 * Props for the PremiumGate component.
 * Blocks premium content for non-subscribers.
 */
export interface PremiumGateProps {
  isPremium: boolean;
  children: ReactNode;
  previewContent?: ReactNode;
}

/**
 * Props for the RichContent component.
 * Renders HTML content with proper styling.
 */
export interface RichContentProps {
  content: string;
  className?: string;
}

/**
 * Props for the DocumentViewer component.
 * Displays PDF and Office documents with viewer controls.
 */
export interface DocumentViewerProps {
  url: string;
  title?: string;
  filename?: string;
}

/**
 * Props for the PdfViewer component.
 * Interactive PDF viewer with navigation and zoom.
 */
export interface PdfViewerProps {
  url: string;
  title?: string;
}

/**
 * Props for the LoadingSpinner component.
 * Reusable loading indicator with optional message.
 */
export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Optional loading message */
  message?: string;
  /** Whether to show in a card container */
  withCard?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the PageLoadingSpinner component.
 * Full-page centered loading spinner.
 */
export interface PageLoadingSpinnerProps {
  message?: string;
}

/**
 * Props for the InlineSpinner component.
 * Inline loading spinner for buttons or small areas.
 */
export interface InlineSpinnerProps {
  className?: string;
}

/**
 * Props for the MainContent component.
 * Main content wrapper with conditional padding.
 */
export interface MainContentProps {
  children: ReactNode;
}

/**
 * Props for the Tooltip component.
 * Displays contextual information on hover.
 */
export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

/**
 * Props for the AuthPrompt component.
 * Shows authentication required message with login button.
 */
export interface AuthPromptProps {
  /** Title text or translation key result */
  title?: string;
  /** Message text or translation key result */
  message?: string;
  /** Button text or translation key result */
  buttonText?: string;
  /** URL to redirect to on button click */
  redirectUrl?: string;
  /** Whether to show in a card container */
  withCard?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the UnauthorizedPrompt component.
 * Shows unauthorized access message for admin-only content.
 */
export interface UnauthorizedPromptProps {
  message?: string;
  className?: string;
}

/**
 * Props for the MultiImageUpload component.
 * Upload multiple images with drag-and-drop or URL input.
 */
export interface MultiImageUploadProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  labels?: {
    title?: string;
    uploadMode?: string;
    urlMode?: string;
    dragDropText?: string;
    orClickToUpload?: string;
    maxFileSize?: string;
    noImagesYet?: string;
    addImageButton?: string;
    removeImageButton?: string;
    uploadError?: string;
    invalidFileType?: string;
  };
  onError?: (message: string) => void;
}

/**
 * Props for the PdfUpload component.
 * Upload single PDF document with preview.
 */
export interface PdfUploadProps {
  pdfUrl: string | null;
  onChange: (url: string | null) => void;
  labels?: {
    title?: string;
    dragDropText?: string;
    orClickToUpload?: string;
    maxFileSize?: string;
    uploadError?: string;
    invalidFileType?: string;
    removeButton?: string;
    viewPdf?: string;
  };
  onError?: (message: string) => void;
}

/**
 * Props for the SettingsPanel component.
 * Drawer panel with app settings (theme, language, etc.).
 */
export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props for the QuoteOfTheDay component.
 * Displays inspirational quote with animation.
 */
export interface QuoteOfTheDayProps {
  className?: string;
}

/**
 * Props for the AIAssistantPanel component.
 * AI chatbot panel for admin and user assistance.
 */
export interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props for the MotionProvider component.
 * Framer Motion config provider with reduced motion support.
 */
export interface MotionProviderProps {
  children: ReactNode;
}

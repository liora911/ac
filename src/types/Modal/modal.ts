import { ReactNode } from "react";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  cancelText?: string;
  children?: ReactNode;
  hideFooter?: boolean;
  // Tailwind max-width class for the dialog (default "max-w-md")
  maxWidthClass?: string;
};

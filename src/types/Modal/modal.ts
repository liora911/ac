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
};

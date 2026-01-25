import { ReactNode } from "react";

export interface TooltipProps {
  children: ReactNode;
  text: string;
}

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

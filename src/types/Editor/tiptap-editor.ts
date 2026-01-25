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

/**
 * Props for the ToolbarButton component in Tiptap editor.
 * Toolbar button with tooltip and active state.
 */
export interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
  title: string;
  disabled?: boolean;
}

/**
 * Props for the DropdownItem component in Tiptap editor.
 * Dropdown menu item with icon and active state.
 */
export interface DropdownItemProps {
  onClick: () => void;
  isActive?: boolean;
  icon?: any;
  label: string;
}

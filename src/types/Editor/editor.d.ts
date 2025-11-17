export interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  theme?: "light" | "dark";
  direction?: "ltr" | "rtl";
  onDirectionChange?: (direction: "ltr" | "rtl") => void;
}

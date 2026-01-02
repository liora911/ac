export type FontSize = "small" | "medium" | "large";
export type DefaultView = "grid" | "list";

export interface SettingsContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
  defaultView: DefaultView;
  setDefaultView: (view: DefaultView) => void;
}

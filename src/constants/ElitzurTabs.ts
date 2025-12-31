export type TabKey =
  | "user"
  | "home"
  | "categories"
  | "articles"
  | "events"
  | "lectures"
  | "presentations"
  | "messages"
  | "settings"
  | "themes";

export interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  disabled?: boolean;
}

export const TABS: Tab[] = [
  { key: "user", label: "משתמש פעיל", icon: "User" },
  { key: "home", label: "דף הבית", icon: "Home" },
  { key: "categories", label: "קטגוריות", icon: "FolderTree" },
  { key: "articles", label: "מאמרים", icon: "FileText" },
  { key: "events", label: "אירועים", icon: "CalendarDays" },
  { key: "lectures", label: "הרצאות", icon: "Video" },
  { key: "presentations", label: "מצגות", icon: "Presentation" },
  { key: "messages", label: "הודעות", icon: "MessageSquare" },
  { key: "themes", label: "ערכות נושא", icon: "Palette" },
  { key: "settings", label: "הגדרות מערכת", icon: "Settings" },
];

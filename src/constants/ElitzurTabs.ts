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

export const TABS: { key: TabKey; label: string; disabled?: boolean }[] = [
  { key: "user", label: "משתמש פעיל" },
  { key: "home", label: "דף הבית" },
  { key: "categories", label: "קטגוריות" },
  { key: "articles", label: "מאמרים" },
  { key: "events", label: "אירועים" },
  { key: "lectures", label: "הרצאות" },
  { key: "presentations", label: "מצגות" },
  { key: "messages", label: "הודעות" },
  { key: "themes", label: "ערכות נושא" },
  { key: "settings", label: "הגדרות מערכת" },
];

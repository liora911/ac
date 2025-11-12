export type TabKey =
  | "user"
  | "categories"
  | "articles"
  | "events"
  | "lectures"
  | "presentations"
  | "messages"
  | "settings"
  | "themes";

export const TABS: { key: TabKey; label: string; disabled?: boolean }[] = [
  { key: "user", label: "החשבון שלך" },
  { key: "categories", label: "קטגוריות" },
  { key: "articles", label: "מאמרים" },
  { key: "events", label: "אירועים" },
  { key: "lectures", label: "הרצאות" },
  { key: "presentations", label: "מצגות" },
  { key: "messages", label: "הודעות" },
  { key: "settings", label: "הגדרות מערכת" },
  { key: "themes", label: "ערכות נושא" },
];

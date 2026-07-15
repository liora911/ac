export type TabKey =
  | "user"
  | "home"
  | "about"
  | "categories"
  | "articles"
  | "events"
  | "lectures"
  | "presentations"
  | "comments"
  | "messages"
  | "notifications"
  | "newsletter"
  | "subscriptions"
  | "settings"
  | "devMetrics"
  | "pdfEditor"
  | "sketchBoard"
  | "guests"
  | "ideas"
  | "calendar";

export interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  disabled?: boolean;
}

export interface TabGroup {
  labelKey: string; // i18n key for group label
  icon: string;     // Lucide icon name for collapsed group button
  tabs: Tab[];
}

export const TAB_GROUPS: TabGroup[] = [
  {
    labelKey: "admin.tabGroups.general",
    icon: "LayoutDashboard",
    tabs: [
      { key: "user", label: "פעולות מהירות", icon: "User" },
      { key: "home", label: "דף הבית", icon: "Home" },
      { key: "about", label: "אודות", icon: "UserCircle" },
    ],
  },
  {
    labelKey: "admin.tabGroups.content",
    icon: "BookOpen",
    tabs: [
      { key: "categories", label: "קטגוריות", icon: "FolderTree" },
      { key: "articles", label: "מאמרים", icon: "FileText" },
      { key: "events", label: "אירועים", icon: "CalendarDays" },
      { key: "lectures", label: "הרצאות", icon: "Video" },
      { key: "presentations", label: "מצגות", icon: "Presentation" },
      { key: "guests", label: "אורחים", icon: "Users" },
    ],
  },
  {
    labelKey: "admin.tabGroups.community",
    icon: "Users",
    tabs: [
      { key: "comments", label: "תגובות", icon: "MessageCircle" },
      { key: "messages", label: "הודעות", icon: "MessageSquare" },
      { key: "notifications", label: "התראות", icon: "Bell" },
      { key: "newsletter", label: "מנויי ניוזלטר", icon: "Mail" },
    ],
  },
  {
    labelKey: "admin.tabGroups.tools",
    icon: "Hammer",
    tabs: [
      { key: "pdfEditor", label: "עורך PDF", icon: "PenTool" },
      { key: "sketchBoard", label: "לוח סקיצות", icon: "Brush" },
      { key: "ideas", label: "רעיונות", icon: "Lightbulb" },
      { key: "calendar", label: "יומן אישי", icon: "CalendarDays" },
    ],
  },
  {
    labelKey: "admin.tabGroups.system",
    icon: "Wrench",
    tabs: [
      { key: "subscriptions", label: "רשומים ומנויים", icon: "CreditCard" },
      { key: "settings", label: "הגדרות מערכת", icon: "Settings" },
      { key: "devMetrics", label: "מדדי מפתחים", icon: "BarChart3" },
    ],
  },
];

// Flat list for backward compat
export const TABS: Tab[] = TAB_GROUPS.flatMap((g) => g.tabs);

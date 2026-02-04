/**
 * Date formatting utilities with locale support
 * Centralizes date formatting to ensure consistency across the app
 */

export type LocaleCode = "he" | "en";
export type DateLocale = "he-IL" | "en-US";

/**
 * Get the date locale string from locale code
 */
export function getDateLocale(locale: LocaleCode | string): DateLocale {
  return locale === "he" ? "he-IL" : "en-US";
}

/**
 * Format date with full format (e.g., "4 בפברואר 2026" or "February 4, 2026")
 * Most commonly used format across the app
 */
export function formatDate(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format date with time (e.g., "4 בפברואר 2026, 14:30")
 */
export function formatDateTime(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date with time using short month (e.g., "4 בפבר׳ 2026, 14:30")
 * Used in ticket timestamps
 */
export function formatDateTimeShort(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date for short display (e.g., "4 בפבר׳ 2026" or "Feb 4, 2026")
 */
export function formatDateShort(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format month and year only (e.g., "פברואר 2026" or "February 2026")
 * Used in calendars
 */
export function formatMonthYear(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });
}

/**
 * Format date with weekday (e.g., "יום שני, 4 בפברואר 2026" or "Monday, February 4, 2026")
 * Used in event details
 */
export function formatDateWithWeekday(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format month and day only (e.g., "4 בפבר׳" or "Feb 4")
 * Used in compact displays like mobile cards
 */
export function formatMonthDay(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format weekday short (e.g., "ראשון" or "Sun")
 * Used in calendars
 */
export function formatWeekdayShort(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return dateObj.toLocaleDateString(dateLocale, {
    weekday: "short",
  });
}

/**
 * Format relative time (e.g., "לפני 3 ימים" or "3 days ago")
 * Useful for comments, notifications, etc.
 */
export function formatRelativeTime(
  date: Date | string,
  locale: LocaleCode | string = "he"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  const isHebrew = locale === "he";

  if (diffMinutes < 1) {
    return isHebrew ? "עכשיו" : "just now";
  }
  if (diffMinutes < 60) {
    return isHebrew
      ? `לפני ${diffMinutes} דקות`
      : `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  }
  if (diffHours < 24) {
    return isHebrew
      ? `לפני ${diffHours} שעות`
      : `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 7) {
    return isHebrew
      ? `לפני ${diffDays} ימים`
      : `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  // Fallback to formatted date
  return formatDate(dateObj, locale);
}

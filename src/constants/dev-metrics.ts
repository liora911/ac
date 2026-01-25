/**
 * Development metrics and Web Vitals constants
 */

export const RATING_COLORS = {
  good: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  "needs-improvement": "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  poor: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
} as const;

export const RATING_LABELS = {
  good: "Good",
  "needs-improvement": "Needs Work",
  poor: "Poor",
} as const;

export const WEB_VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000, unit: "ms", description: "Largest Contentful Paint - How fast the main content loads" },
  FID: { good: 100, poor: 300, unit: "ms", description: "First Input Delay - How responsive to user input" },
  CLS: { good: 0.1, poor: 0.25, unit: "", description: "Cumulative Layout Shift - Visual stability of the page" },
  TTFB: { good: 800, poor: 1800, unit: "ms", description: "Time to First Byte - Server response time" },
  INP: { good: 200, poor: 500, unit: "ms", description: "Interaction to Next Paint - Overall responsiveness" },
} as const;

export type WebVitalName = keyof typeof WEB_VITAL_THRESHOLDS;
export type RatingType = keyof typeof RATING_COLORS;

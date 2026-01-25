/**
 * API configuration constants
 */

/** Default number of items to return in API responses */
export const DEFAULT_LIMIT = 9;

/** Maximum number of favorites allowed per content type */
export const MAX_FAVORITES_PER_TYPE = 10;

/** Vercel Analytics API base URL */
export const VERCEL_API_BASE = "https://api.vercel.com";

/** AI Assistant blocked patterns for filtering sensitive content */
export const BLOCKED_PATTERNS = [
  /\b(?:password|secret|key|token|api[-_]?key|private[-_]?key)\b/i,
  /\b(?:credit[-_]?card|ssn|social[-_]?security)\b/i,
  /\b(?:hack|exploit|vulnerability|injection)\b/i,
];

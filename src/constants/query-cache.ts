/**
 * Centralized React Query cache configuration
 * Edit cache durations here - all hooks will use these values
 */

/** Cache config for a single resource type */
export interface QueryCacheConfig {
  /** Time before data is considered stale (ms) */
  staleTime: number;
  /** Time before inactive data is garbage collected (ms) */
  gcTime: number;
}

/** Helper to create cache config in minutes */
const minutes = (n: number) => n * 60 * 1000;

/**
 * Cache configurations by resource type
 *
 * staleTime: How long before React Query refetches in background
 * gcTime: How long unused data stays in cache before garbage collection
 */
export const queryCache = {
  /** Home content - hero sections, bio */
  homeContent: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },

  /** Articles list */
  articles: {
    staleTime: minutes(120),
    gcTime: minutes(720), // 12 hours
  },

  /** Single article detail */
  article: {
    staleTime: minutes(30),
    gcTime: minutes(120),
  },

  /** Article search results */
  articleSearch: {
    staleTime: minutes(2),
    gcTime: minutes(10),
  },

  /** Lectures list (tree structure) */
  lectures: {
    staleTime: minutes(60),
    gcTime: minutes(360),
  },

  /** Single lecture detail */
  lecture: {
    staleTime: minutes(30),
    gcTime: minutes(120),
  },

  /** Presentations list (tree structure) */
  presentations: {
    staleTime: minutes(60),
    gcTime: minutes(360),
  },

  /** Single presentation detail */
  presentation: {
    staleTime: minutes(30),
    gcTime: minutes(120),
  },

  /** Events list */
  events: {
    staleTime: minutes(30),
    gcTime: minutes(120),
  },

  /** Single event detail */
  event: {
    staleTime: minutes(30),
    gcTime: minutes(120),
  },

  /** User favorites */
  favorites: {
    staleTime: minutes(10),
    gcTime: minutes(60),
  },

  /** Categories list */
  categories: {
    staleTime: minutes(60),
    gcTime: minutes(360),
  },

  /** Site settings */
  siteSettings: {
    staleTime: minutes(60),
    gcTime: minutes(360),
  },

  /** Notifications (admin list) */
  notifications: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },

  /** User notifications */
  userNotifications: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },

  /** Unread notification count - more frequent */
  unreadCount: {
    staleTime: minutes(2),
    gcTime: minutes(30),
  },

  /** Home preview data */
  homePreview: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },

  /** Archive items (admin only) */
  archive: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },

  /** Article comments - shorter cache for real-time feel */
  comments: {
    staleTime: minutes(1),
    gcTime: minutes(10),
  },

  /** Newsletter subscribers (admin only) */
  newsletter: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },

  /** Default for any unspecified resource */
  default: {
    staleTime: minutes(5),
    gcTime: minutes(30),
  },
} as const satisfies Record<string, QueryCacheConfig>;

/** Type for cache keys */
export type QueryCacheKey = keyof typeof queryCache;

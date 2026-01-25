/**
 * Breadcrumb navigation constants
 */

/** Map of URL segments to translation keys */
export const STATIC_SEGMENT_KEYS: Record<string, string> = {
  // Main navigation
  articles: "nav.articles",
  article: "nav.articles",
  presentations: "nav.presentations",
  lectures: "nav.lectures",
  events: "nav.events",
  contact: "nav.contact",
  about: "breadcrumbs.about",
  search: "breadcrumbs.search",
  browse: "breadcrumbs.browse",
  // Admin
  elitzur: "breadcrumbs.adminDashboard",
  // Edit pages (root level pattern)
  "edit-article": "breadcrumbs.edit",
  "edit-lecture": "breadcrumbs.edit",
  "edit-presentation": "breadcrumbs.edit",
  "edit-event": "breadcrumbs.edit",
  // Create pages
  "create-lecture": "breadcrumbs.createNew",
  "create-presentation": "breadcrumbs.createNew",
  "create-event": "breadcrumbs.createNew",
  create: "breadcrumbs.createNew",
  // Nested edit (for /articles/[id]/edit pattern)
  edit: "breadcrumbs.edit",
  // Tickets
  "ticket-acquire": "breadcrumbs.reserveTicket",
  "ticket-summary": "breadcrumbs.ticketSummary",
  tickets: "breadcrumbs.tickets",
  "my-tickets": "breadcrumbs.myTickets",
  // Account
  account: "breadcrumbs.account",
} as const;

/** Segments that should NOT be clickable (no page exists at that path) */
export const NON_CLICKABLE_SEGMENTS = new Set([
  "edit-article",
  "edit-lecture",
  "edit-presentation",
  "edit-event",
  "create-lecture",
  "create-presentation",
  "create-event",
  "ticket-summary",
]);

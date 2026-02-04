/**
 * Status utilities for tickets and subscriptions
 * Centralizes status colors and text to ensure consistency
 */

export type TicketStatus = "CONFIRMED" | "PENDING" | "CANCELLED" | "ATTENDED";
export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED";
export type ArticleStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

/**
 * Get Tailwind classes for ticket status badge
 */
export function getTicketStatusColor(status: TicketStatus | string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    case "ATTENDED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get Tailwind classes for subscription status badge
 */
export function getSubscriptionStatusColor(status: SubscriptionStatus | string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "CANCELED":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    case "PAST_DUE":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "EXPIRED":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

/**
 * Get Tailwind classes for article status badge
 */
export function getArticleStatusColor(status: ArticleStatus | string | boolean): string {
  if (typeof status === "boolean") {
    return status
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  }
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "ARCHIVED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Translation keys for ticket status
 */
export const TICKET_STATUS_KEYS: Record<TicketStatus, string> = {
  CONFIRMED: "tickets.statusConfirmed",
  PENDING: "tickets.statusPending",
  CANCELLED: "tickets.statusCancelled",
  ATTENDED: "tickets.statusAttended",
};

/**
 * Translation keys for subscription status
 */
export const SUBSCRIPTION_STATUS_KEYS: Record<SubscriptionStatus, string> = {
  ACTIVE: "account.subscription.active",
  CANCELED: "account.subscription.canceled",
  PAST_DUE: "account.subscription.pastDue",
  EXPIRED: "admin.subscriptions.expired",
};

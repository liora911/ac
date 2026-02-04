/**
 * Share utilities for copying URLs to clipboard
 * Centralizes share functionality across the app
 */

import { copyToClipboard } from "./clipboard";

export type ShareItemType =
  | "article"
  | "lecture"
  | "presentation"
  | "event"
  | "ticket";

/**
 * Build a shareable URL for an item
 */
export function buildShareUrl(
  itemType: ShareItemType,
  itemId: string,
  baseUrl?: string
): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");

  const pathMap: Record<ShareItemType, string> = {
    article: "articles",
    lecture: "lectures",
    presentation: "presentations",
    event: "events",
    ticket: "ticket-summary",
  };

  return `${base}/${pathMap[itemType]}/${itemId}`;
}

/**
 * Copy a share URL to clipboard
 * Returns true on success, false on failure
 */
export async function shareUrl(url: string): Promise<boolean> {
  try {
    await copyToClipboard(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build and copy a share URL for an item
 * Convenience function combining buildShareUrl and shareUrl
 */
export async function shareItem(
  itemType: ShareItemType,
  itemId: string,
  baseUrl?: string
): Promise<{ success: boolean; url: string }> {
  const url = buildShareUrl(itemType, itemId, baseUrl);
  const success = await shareUrl(url);
  return { success, url };
}

/**
 * Try to use native Web Share API, fallback to clipboard
 * Returns { shared: boolean, method: 'native' | 'clipboard' | 'failed' }
 */
export async function shareWithNativeOrClipboard(
  url: string,
  title?: string,
  text?: string
): Promise<{ shared: boolean; method: "native" | "clipboard" | "failed" }> {
  // Try native share first (mobile browsers)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { shared: true, method: "native" };
    } catch (err) {
      // User cancelled or share failed, fallback to clipboard
      if ((err as Error).name === "AbortError") {
        return { shared: false, method: "failed" };
      }
    }
  }

  // Fallback to clipboard
  const success = await shareUrl(url);
  return {
    shared: success,
    method: success ? "clipboard" : "failed",
  };
}

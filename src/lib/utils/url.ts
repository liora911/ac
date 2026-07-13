/**
 * Normalize a user-entered external URL so it is always absolute.
 * "devteam.com" would otherwise render as a relative link and resolve
 * against the current page instead of leaving the site.
 */
export function normalizeExternalUrl(url?: string | null): string | null {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

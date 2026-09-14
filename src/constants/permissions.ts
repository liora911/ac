import { ALLOWED_EMAILS } from "@/constants/auth";

/**
 * Basic RBAC helpers.
 *
 * Access model:
 * - A full ADMIN (role === "ADMIN", or a hardcoded ALLOWED_EMAILS fallback so
 *   the founders can never be locked out) implicitly has every section and can
 *   manage the team.
 * - A section manager is an ordinary user granted specific section keys in
 *   `User.permissions` (e.g. ["guests"]). They can reach /elitzur and see only
 *   the sections they were granted.
 *
 * Phased rollout: only sections listed in GRANTABLE_SECTIONS are actually wired
 * end-to-end (API gate + dashboard tab). Add a section here once its API uses
 * requirePermission() and its tab reads hasPermission().
 */

export type SectionKey = "guests";

export interface GrantableSection {
  key: SectionKey;
  /** i18n key for the section's display label */
  labelKey: string;
}

export const GRANTABLE_SECTIONS: GrantableSection[] = [
  { key: "guests", labelKey: "admin.nav.guests" },
];

const GRANTABLE_KEYS = new Set<string>(GRANTABLE_SECTIONS.map((s) => s.key));

/** Minimal shape needed to reason about access — works for a session user or a DB user. */
export interface AccessUser {
  role?: string | null;
  email?: string | null;
  permissions?: string[] | null;
}

/** Full admin: DB role ADMIN, or a founder email as an always-on fallback. */
export function isFullAdmin(user: AccessUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const email = user.email?.toLowerCase();
  return !!email && ALLOWED_EMAILS.includes(email);
}

/** True if the user may manage the given section (full admins always can). */
export function hasPermission(
  user: AccessUser | null | undefined,
  section: string
): boolean {
  if (!user) return false;
  if (isFullAdmin(user)) return true;
  return (user.permissions ?? []).includes(section);
}

/** True if the user has any reason to see the admin dashboard at all. */
export function hasAnyAdminAccess(user: AccessUser | null | undefined): boolean {
  if (!user) return false;
  if (isFullAdmin(user)) return true;
  return (user.permissions ?? []).some((p) => GRANTABLE_KEYS.has(p));
}

/** Keep only recognized, wired section keys — sanitizes input from the team UI. */
export function sanitizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input)].filter(
    (p): p is string => typeof p === "string" && GRANTABLE_KEYS.has(p)
  );
}

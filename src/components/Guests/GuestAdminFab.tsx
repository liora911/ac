"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { isFullAdmin, hasPermission } from "@/constants/permissions";

/**
 * Floating "quick edit" button on a guest's public page.
 * - Guests managers (full admin or the "guests" permission) deep-link into the
 *   Guests admin tab to edit any field.
 * - A linked owner (not a manager) gets an "Edit my page" link to their own
 *   owner-scoped editor.
 * - Everyone else sees nothing.
 */
export default function GuestAdminFab({
  guestId,
  slug,
  isOwner = false,
}: {
  guestId?: string;
  slug?: string | null;
  isOwner?: boolean;
}) {
  const { data: session } = useSession();
  const { locale } = useTranslation();

  const isManager =
    isFullAdmin(session?.user) || hasPermission(session?.user, "guests");

  let href: string | null = null;
  let label = "";
  if (isManager) {
    href = guestId
      ? `/elitzur?tab=guests&editGuest=${guestId}`
      : "/elitzur?tab=guests";
    label = locale === "he" ? "עריכה מהירה" : "Quick edit";
  } else if (isOwner && slug) {
    href = `/guests/${slug}/edit`;
    label = locale === "he" ? "עריכת העמוד שלי" : "Edit my page";
  }

  if (!href) return null;

  return (
    <Link
      href={href}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
      title={label}
      aria-label={label}
    >
      <Pencil className="w-5 h-5" />
      <span className="hidden sm:inline font-medium">{label}</span>
    </Link>
  );
}

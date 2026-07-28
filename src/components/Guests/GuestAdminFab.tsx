"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Floating "quick edit" button, admin-only — mirrors the article edit FAB.
 * Deep-links straight into the Guests admin tab (optionally opening a
 * specific guest's edit form) so the professor edits from the public page
 * without navigating the whole admin ceremony.
 */
export default function GuestAdminFab({ guestId }: { guestId?: string }) {
  const { data: session } = useSession();
  const { locale } = useTranslation();

  if (session?.user?.role !== "ADMIN") return null;

  const href = guestId
    ? `/elitzur?tab=guests&editGuest=${guestId}`
    : "/elitzur?tab=guests";
  const label = locale === "he" ? "עריכה מהירה" : "Quick edit";

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

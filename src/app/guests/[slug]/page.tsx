"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuest } from "@/hooks/useGuests";
import RichContent from "@/components/RichContent/RichContent";
import { normalizeExternalUrl } from "@/lib/utils/url";
import GuestAdminFab from "@/components/Guests/GuestAdminFab";
import { ArrowLeft, ArrowRight, ExternalLink, Loader2 } from "lucide-react";

export default function GuestProfilePage() {
  const params = useParams<{ slug: string }>();
  const { t, locale } = useTranslation();
  const { data: guest, isLoading, isError } = useGuest(params?.slug);

  const BackArrow = locale === "he" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !guest) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t("guests.notFound")}
        </p>
        <Link
          href="/guests"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <BackArrow className="w-4 h-4" />
          {t("guests.backToGuests")}
        </Link>
      </div>
    );
  }

  // English visitors see the English title when one is set
  const displayName =
    locale === "he" ? guest.name : guest.nameEn?.trim() || guest.name;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <GuestAdminFab guestId={guest.id} />
      {/* Banner */}
      {guest.bannerImageUrl && (
        <div className="h-48 md:h-64 w-full overflow-hidden">
          <img
            src={guest.bannerImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pb-14">
        {/* Profile header */}
        <div
          className={`flex flex-col items-center text-center ${
            guest.bannerImageUrl ? "-mt-14" : "pt-10"
          }`}
        >
          {guest.photoUrl ? (
            <img
              src={guest.photoUrl}
              alt={displayName}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-lg">
              {displayName.charAt(0)}
            </div>
          )}
          <h1
            dir={guest.titleDirection}
            className="mt-4 text-3xl font-bold text-[var(--foreground)]"
          >
            {displayName}
          </h1>
          {guest.headline && (
            <p
              dir={guest.titleDirection}
              className="mt-2 text-gray-600 dark:text-gray-300"
            >
              {guest.headline}
            </p>
          )}
          {guest.websiteUrl && (
            <a
              href={normalizeExternalUrl(guest.websiteUrl) ?? guest.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {t("guests.visitWebsite")}
            </a>
          )}
        </div>

        {/* Body — the guest's whole page: text, images, everything, freely
            arranged by the professor in the rich editor */}
        {guest.bio && (
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-10 shadow-sm">
            <RichContent
              content={guest.bio}
              className="text-gray-700 dark:text-gray-200"
            />
          </div>
        )}
      </div>
    </div>
  );
}

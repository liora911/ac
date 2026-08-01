"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuests } from "@/hooks/useGuests";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import GuestAdminFab from "@/components/Guests/GuestAdminFab";
import CardGrid from "@/components/CardGrid/CardGrid";
import EmptyState from "@/components/EmptyState/EmptyState";
import { Users, Star } from "lucide-react";

export default function GuestsPage() {
  const { t, locale } = useTranslation();
  const { data: guests, isLoading, isError } = useGuests();
  const { data: settings } = useSiteSettings();

  // Admin-controlled subtitle; falls back to the built-in translation if empty
  const customSubtitle =
    locale === "he" ? settings?.guestsSubtitleHe : settings?.guestsSubtitleEn;
  const subtitle = customSubtitle?.trim() || t("guests.subtitle");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <GuestAdminFab />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            {t("guests.title")}
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="mx-auto mt-4 w-16 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {isLoading ? (
          <CardGrid>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="relative w-full sm:w-80 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden animate-pulse"
              >
                <div className="h-28 w-full bg-gray-200 dark:bg-gray-700" />
                <div className="absolute top-[76px] start-5 w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 ring-4 ring-white dark:ring-gray-800" />
                <div className="pt-12 px-5 pb-5">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />
                </div>
              </div>
            ))}
          </CardGrid>
        ) : isError ? (
          <p className="text-center text-red-500 dark:text-red-400 py-16">
            {t("guests.loadError")}
          </p>
        ) : !guests || guests.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("guests.empty")}
            description={t("guests.emptyDescription")}
          />
        ) : (
          <CardGrid>
            {guests.map((guest) => {
              const displayName =
                locale === "he"
                  ? guest.name
                  : guest.nameEn?.trim() || guest.name;
              return (
              <Link
                key={guest.id}
                href={`/guests/${guest.slug || guest.id}`}
                className="group relative w-full sm:w-80 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all overflow-hidden"
              >
                {/* Cover thumbnail — the guest's banner image fills the top */}
                <div className="h-28 w-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                  {guest.bannerImageUrl && (
                    <img
                      src={guest.bannerImageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                {guest.isFeatured && (
                  <span className="absolute top-3 end-3 text-amber-400 drop-shadow">
                    <Star className="w-5 h-5 fill-current" />
                  </span>
                )}

                {/* Avatar floats at the corner, straddling cover and body */}
                <div className="absolute top-[76px] start-5">
                  {guest.photoUrl ? (
                    <img
                      src={guest.photoUrl}
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-gray-800 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white dark:ring-gray-800 shadow-md">
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="pt-12 px-5 pb-5 text-start">
                  <h2
                    dir={guest.titleDirection}
                    className="font-serif text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                  >
                    {displayName}
                  </h2>
                  {guest.headline && (
                    <p
                      dir={guest.titleDirection}
                      className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                    >
                      {guest.headline}
                    </p>
                  )}
                </div>
              </Link>
              );
            })}
          </CardGrid>
        )}
      </div>
    </div>
  );
}

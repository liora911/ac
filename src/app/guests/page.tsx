"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuests } from "@/hooks/useGuests";
import { Users, Star } from "lucide-react";

export default function GuestsPage() {
  const { t } = useTranslation();
  const { data: guests, isLoading, isError } = useGuests();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            {t("guests.title")}
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("guests.subtitle")}
          </p>
          <div className="mx-auto mt-4 w-16 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 animate-pulse"
              >
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mt-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mt-2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-center text-red-500 dark:text-red-400 py-16">
            {t("guests.loadError")}
          </p>
        ) : !guests || guests.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            {t("guests.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guests.map((guest) => (
              <Link
                key={guest.id}
                href={`/guests/${guest.slug || guest.id}`}
                className="group relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              >
                {guest.isFeatured && (
                  <span className="absolute top-3 end-3 text-amber-400">
                    <Star className="w-5 h-5 fill-current" />
                  </span>
                )}
                {guest.photoUrl ? (
                  <img
                    src={guest.photoUrl}
                    alt={guest.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-gray-100 dark:ring-gray-700 group-hover:ring-blue-100 dark:group-hover:ring-blue-900/50 transition-all"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                    {guest.name.charAt(0)}
                  </div>
                )}
                <h2
                  dir={guest.titleDirection}
                  className="mt-4 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  {guest.name}
                </h2>
                {guest.headline && (
                  <p
                    dir={guest.titleDirection}
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                  >
                    {guest.headline}
                  </p>
                )}
                {guest._count && (
                  <p className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {guest._count.works} {t("guests.worksLabel")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

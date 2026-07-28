"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import ChevronDisc from "@/components/Carousel/ChevronDisc";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useGuests } from "@/hooks/useGuests";

/**
 * Homepage "Guests" carousel — visually distinct from the poster carousels:
 * circular avatars in a horizontally-scrolling row, because guests are people,
 * not content posters. Shows featured guests only; renders nothing when there
 * are none, so it never leaves an empty section on the page.
 */
const GuestsCarouselSection: React.FC = () => {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const { data: guests } = useGuests();

  const featured = useMemo(
    () => (guests ?? []).filter((g) => g.isFeatured),
    [guests]
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // abs() so this works under RTL, where scrollLeft runs negative
    const x = Math.abs(el.scrollLeft);
    setCanPrev(x > 4);
    setCanNext(x < max - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [featured, updateArrows]);

  const scrollByDir = useCallback(
    (logical: 1 | -1) => {
      const el = scrollerRef.current;
      if (!el) return;
      const amount = el.clientWidth * 0.8;
      // "next" advances toward the end of the list; in RTL that's leftward
      const physical = (isRTL ? -1 : 1) * logical * amount;
      el.scrollBy({ left: physical, behavior: "smooth" });
    },
    [isRTL]
  );

  const goNext = () => scrollByDir(1);
  const goPrev = () => scrollByDir(-1);

  // The left button always affects what's visually on the left
  const onLeft = isRTL ? goNext : goPrev;
  const onRight = isRTL ? goPrev : goNext;
  const showLeft = isRTL ? canNext : canPrev;
  const showRight = isRTL ? canPrev : canNext;

  if (featured.length === 0) return null;

  return (
    <motion.div
      className="mb-10"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 md:px-10 lg:px-12">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {t("home.sections.guests")}
        </h2>
        <Link
          href="/guests"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t("home.sections.viewAll")}
        </Link>
      </div>

      <div className="relative group">
        {showLeft && (
          <button
            onClick={onLeft}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 items-center justify-center bg-gradient-to-r from-[var(--background)] via-[var(--background)]/60 to-transparent transition-opacity duration-300 opacity-70 group-hover:opacity-100 cursor-pointer"
            aria-label={isRTL ? t("common.next") : t("common.previous")}
          >
            <ChevronDisc dir="left" />
          </button>
        )}

        {showRight && (
          <button
            onClick={onRight}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 items-center justify-center bg-gradient-to-l from-[var(--background)] via-[var(--background)]/60 to-transparent transition-opacity duration-300 opacity-70 group-hover:opacity-100 cursor-pointer"
            aria-label={isRTL ? t("common.previous") : t("common.next")}
          >
            <ChevronDisc dir="right" />
          </button>
        )}

        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          dir={isRTL ? "rtl" : "ltr"}
          className="overflow-x-auto scrollbar-hide px-4 sm:px-6 md:px-10 lg:px-12 pb-2"
        >
          <div className="flex gap-6 w-max">
            {featured.map((guest) => {
              const displayName =
                locale === "he"
                  ? guest.name
                  : guest.nameEn?.trim() || guest.name;
              const href = `/guests/${guest.slug ?? guest.id}`;

              return (
                <Link
                  key={guest.id}
                  href={href}
                  className="flex-shrink-0 w-36 sm:w-40 flex flex-col items-center text-center group/card"
                >
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-900 shadow-lg transition-transform duration-300 group-hover/card:scale-105">
                    {guest.photoUrl ? (
                      <Image
                        src={guest.photoUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                        {displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3
                    dir={guest.titleDirection}
                    className="mt-3 text-sm font-semibold text-[var(--foreground)] line-clamp-2 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors"
                  >
                    {displayName}
                  </h3>
                  {guest.headline && (
                    <p
                      dir={guest.titleDirection}
                      className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2"
                    >
                      {guest.headline}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GuestsCarouselSection;

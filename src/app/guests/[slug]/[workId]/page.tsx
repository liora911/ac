"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuestWork } from "@/hooks/useGuests";
import RichContent from "@/components/RichContent/RichContent";
import { getYouTubeVideoId } from "@/lib/utils/youtube";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";

const PdfViewer = dynamic(() => import("@/components/PdfViewer/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ),
});

export default function GuestWorkPage() {
  const params = useParams<{ slug: string; workId: string }>();
  const { t, locale } = useTranslation();
  const { data: work, isLoading, isError } = useGuestWork(params?.workId);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const BackArrow = locale === "he" ? ArrowRight : ArrowLeft;

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const stepLightbox = useCallback(
    (dir: -1 | 1) => {
      setLightboxIdx((idx) => {
        if (idx == null || !work) return idx;
        const len = work.imageUrls.length;
        return (idx + dir + len) % len;
      });
    },
    [work]
  );

  // Keyboard navigation for the lightbox
  useEffect(() => {
    if (lightboxIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, closeLightbox, stepLightbox]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !work) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t("guests.workNotFound")}
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

  const guestHref = `/guests/${work.guest?.slug || work.guestId}`;
  const videoId = getYouTubeVideoId(work.videoUrl);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-10 pb-14">
        {/* Guest attribution */}
        {work.guest && (
          <Link
            href={guestHref}
            className="inline-flex items-center gap-3 mb-6 group"
          >
            {work.guest.photoUrl ? (
              <img
                src={work.guest.photoUrl}
                alt={work.guest.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {work.guest.name.charAt(0)}
              </div>
            )}
            <div>
              <div
                dir={work.guest.titleDirection}
                className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              >
                {work.guest.name}
              </div>
              {work.guest.headline && (
                <div
                  dir={work.guest.titleDirection}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {work.guest.headline}
                </div>
              )}
            </div>
          </Link>
        )}

        <h1
          dir={work.titleDirection}
          className="text-3xl md:text-4xl font-bold text-[var(--foreground)]"
        >
          {work.title}
        </h1>
        {work.description && (
          <p
            dir={work.titleDirection}
            className="mt-3 text-lg text-gray-600 dark:text-gray-300"
          >
            {work.description}
          </p>
        )}
        {work.category && (
          <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {work.category.name}
          </span>
        )}

        {/* Video */}
        {videoId && (
          <div className="mt-8 aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={work.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {/* Story / rich content */}
        {work.content && (
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm">
            <RichContent
              content={work.content}
              className="text-gray-700 dark:text-gray-200"
            />
          </div>
        )}

        {/* Gallery */}
        {work.imageUrls.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
              {t("guests.gallery")} ({work.imageUrls.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {work.imageUrls.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-zoom-in group"
                  aria-label={`${work.title} ${idx + 1}`}
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PDF */}
        {work.pdfUrl && (
          <div className="mt-8">
            <PdfViewer url={work.pdfUrl} title={work.title} />
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href={guestHref}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <BackArrow className="w-4 h-4" />
            {t("guests.backToGuest")}
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx != null && work.imageUrls[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 end-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label={t("guests.closeLightbox")}
          >
            <X className="w-6 h-6" />
          </button>
          {work.imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(-1);
                }}
                className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(1);
                }}
                className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}
          <img
            src={work.imageUrls[lightboxIdx]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {lightboxIdx + 1} / {work.imageUrls.length}
          </div>
        </div>
      )}
    </div>
  );
}

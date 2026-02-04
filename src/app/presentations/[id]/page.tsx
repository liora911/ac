"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Presentation } from "@/types/Presentations/presentations";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import dynamic from "next/dynamic";
import RichContent from "@/components/RichContent";
import PremiumGate from "@/components/PremiumGate/PremiumGate";
import { Sparkles, Play, Share2, Pencil } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import FavoriteButton from "@/components/FavoriteButton";
import SlidesPlayer from "@/components/Presentations/SlidesPlayer";
import { shareItem } from "@/lib/utils/share";
import { formatDate } from "@/lib/utils/date";

// Dynamic import for DocumentViewer to avoid SSR issues with react-pdf
const DocumentViewer = dynamic(() => import("@/components/DocumentViewer/DocumentViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
    </div>
  ),
});

function getGoogleSlidesEmbedAndPdfUrls(rawUrl?: string | null): {
  embedUrl?: string;
  pdfUrl?: string;
} {
  if (!rawUrl) return { embedUrl: undefined, pdfUrl: undefined };

  try {
    const url = new URL(rawUrl);

    if (
      url.hostname.includes("docs.google.com") &&
      url.pathname.includes("/presentation/d/")
    ) {
      const parts = url.pathname.split("/");
      const dIndex = parts.indexOf("d");
      const fileId =
        dIndex !== -1 && parts[dIndex + 1] ? parts[dIndex + 1] : null;

      if (fileId) {
        const embedUrl = `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
        const pdfUrl = `https://docs.google.com/presentation/d/${fileId}/export/pdf`;
        return { embedUrl, pdfUrl };
      }
    }
  } catch {}

  return { embedUrl: rawUrl, pdfUrl: undefined };
}

export default function PresentationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const { t, locale } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
  const isAuthor = presentation?.author.email === session?.user?.email;

  const total = presentation?.imageUrls.length ?? 0;
  const hasGoogleSlidesUrl = Boolean(presentation?.googleSlidesUrl);
  const hasPdfUrl = Boolean(presentation?.pdfUrl);
  const hasMainContent = hasGoogleSlidesUrl || hasPdfUrl;
  const thumbnailUrl = presentation?.imageUrls[0] || null;
  const { embedUrl } = getGoogleSlidesEmbedAndPdfUrls(
    hasGoogleSlidesUrl ? (presentation!.googleSlidesUrl as string) : undefined
  );

  const next = () => setCurrentImageIndex((i) => (i + 1) % total);
  const prev = () => setCurrentImageIndex((i) => (i - 1 + total) % total);

  const handleShare = async () => {
    const { success } = await shareItem("presentation", id);
    if (success) {
      showSuccess(t("presentations.linkCopied"));
    } else {
      showError(t("presentations.copyError"));
    }
  };

  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/presentations/${id}`);
        if (!response.ok) {
          throw new Error("Presentation not found");
        }
        const data = await response.json();
        setPresentation(data);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPresentation();
    }
  }, [id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-200 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-medium text-slate-800">
            {t("presentationDetail.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-rose-600 mb-4">
            {t("presentationDetail.errorTitle")}
          </h1>
          <p className="text-slate-600 mb-6">
            {error || t("presentationDetail.notFound")}
          </p>
          <button
            onClick={() => router.push("/presentations")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all cursor-pointer"
          >
            {t("presentationDetail.backToPresentations")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {/* Admin Edit Button - Fixed position */}
      {isAuthorized && (
        <Link
          href={`/edit-presentation/${id}`}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title={t("presentationDetail.editButton")}
        >
          <Pencil className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">
            {t("presentationDetail.editButton")}
          </span>
        </Link>
      )}

      {/* Fixed full-page blurred background when thumbnail exists and has main content */}
      {hasMainContent && thumbnailUrl && (
        <>
          <div className="fixed inset-0 z-0">
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              className="object-cover blur-sm scale-105"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/50 to-slate-900/70" />
          </div>
        </>
      )}

      {/* All content scrolls over the fixed background */}
      <div className={`relative z-10 ${!hasMainContent || !thumbnailUrl ? "bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100" : ""}`}>
        {/* Hero title section - compact header */}
        {hasMainContent && thumbnailUrl && (
          <div className="flex flex-col items-center justify-center px-4 pt-16 pb-8">
            {presentation.isPremium && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/90 text-white mb-4">
                <Sparkles className="w-4 h-4" />
                {t("presentationDetail.premium") || "Premium"}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-bold text-white text-center tracking-tight drop-shadow-lg max-w-3xl px-4">
              {presentation.title}
            </h1>
            {/* Category */}
            <p className="text-white/70 mt-4 text-sm">
              {presentation.category.name}
            </p>
            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors cursor-pointer border border-white/20"
                title={t("common.share")}
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <FavoriteButton
                itemId={presentation.id}
                itemType="PRESENTATION"
                size="lg"
                className="!bg-white/10 hover:!bg-white/20 !border-white/20 backdrop-blur-sm [&_svg]:!text-white [&_svg]:hover:!text-red-400"
              />
            </div>
          </div>
        )}

        {/* Content section with glass morphism background when over blurred image */}
        <div className={`${hasMainContent && thumbnailUrl ? "bg-slate-900/40 backdrop-blur-md" : ""}`}>
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${hasMainContent && thumbnailUrl ? "pt-6 pb-10" : "py-10"}`}>
        {/* Back button */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/presentations")}
            className="bg-white/90 text-slate-800 border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-700 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm"
          >
            ← {t("presentationDetail.backToPresentations")}
          </button>
        </div>

        {/* Premium Badge - only show when no hero */}
        {!hasMainContent && presentation.isPremium && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              <Sparkles className="w-4 h-4" />
              {t("presentationDetail.premium") || "Premium"}
            </span>
          </div>
        )}

        {/* Title - only show when no hero */}
        {!(hasMainContent && thumbnailUrl) && (
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-8 text-center tracking-tight">
            {presentation.title}
          </h1>
        )}

        <PremiumGate isPremium={presentation.isPremium}>
        {hasGoogleSlidesUrl && embedUrl && (
          <div className="mb-8 flex flex-col items-center gap-4">
            {/* Watch in Player Button */}
            <button
              onClick={() => setIsPlayerOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all cursor-pointer font-medium"
            >
              <Play className="w-5 h-5" />
              {t("presentationDetail.watchInPlayer")}
            </button>

            <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md">
              <iframe
                src={embedUrl}
                title={presentation.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {hasPdfUrl && presentation.pdfUrl && (
          <div className="mb-8 w-full max-w-4xl mx-auto">
            <DocumentViewer
              url={presentation.pdfUrl}
              title={presentation.title}
            />
          </div>
        )}

        {/* Image carousel - only show when there's no main content (no Google Slides, no PDF) */}
        {!hasMainContent && presentation.imageUrls.length > 0 && (
          <div
            className="relative w-full aspect-video mb-8 rounded-2xl overflow-hidden bg-white/90 border border-slate-200 cursor-zoom-in shadow-md hover:shadow-lg transition-shadow"
            onClick={() => setIsModalOpen(true)}
          >
            <Image
              src={presentation.imageUrls[currentImageIndex]}
              alt={`${presentation.title} - ${t("presentationDetail.image")} ${
                currentImageIndex + 1
              }`}
              fill
              className="object-contain transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />

            {total > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-700 rounded-full p-3 shadow-md z-10 cursor-pointer transition-colors border border-slate-200"
                >
                  &#8592;
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-700 rounded-full p-3 shadow-md z-10 cursor-pointer transition-colors border border-slate-200"
                >
                  &#8594;
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {currentImageIndex + 1} / {total}
                </div>
              </>
            )}
          </div>
        )}

        {/* Thumbnail strip - only show when there's no main content and multiple images */}
        {!hasMainContent && total > 1 && (
          <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-3">
            {presentation.imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
                  index === currentImageIndex
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <Image
                  src={url}
                  alt={`${t("presentationDetail.image")} ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}

        {/* Description - only show if filled */}
        {presentation.description && presentation.description.replace(/<[^>]*>/g, "").trim() !== "" && (
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t("presentationDetail.descriptionTitle")}
            </h2>
            <RichContent content={presentation.description} className="text-slate-700" />
          </div>
        )}

        {/* Content - only show if filled */}
        {presentation.content && presentation.content.replace(/<[^>]*>/g, "").trim() !== "" && (
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t("presentationDetail.contentTitle")}
            </h2>
            <RichContent content={presentation.content} className="text-slate-700" />
          </div>
        )}
        </PremiumGate>

        {/* Footer info */}
        <div className={`mt-8 text-center ${hasMainContent && thumbnailUrl ? "text-white/60" : "text-slate-500"}`}>
          <p className={`text-xs mt-1 ${hasMainContent && thumbnailUrl ? "text-white/50" : "text-slate-400"}`}>
            {t("presentationDetail.categoryLabel")}:{" "}
            {presentation.category.name} •{" "}
            {t("presentationDetail.createdAtLabel")}:{" "}
            {formatDate(presentation.createdAt, locale)}
          </p>
        </div>

        {/* Full-screen image modal - only when no main content */}
        {!hasMainContent && isModalOpen && (
          <div
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 cursor-zoom-out"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="relative w-full max-w-6xl h-[90vh]">
              <Image
                src={presentation.imageUrls[currentImageIndex]}
                alt={t("presentationDetail.fullViewAlt")}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />

              {total > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-700 rounded-full p-4 shadow-md z-10 cursor-pointer transition-colors border border-slate-200"
                  >
                    &#8592;
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-indigo-700 rounded-full p-4 shadow-md z-10 cursor-pointer transition-colors border border-slate-200"
                  >
                    &#8594;
                  </button>
                </>
              )}

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-md z-10 cursor-pointer transition-colors border border-slate-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Slides Player */}
        {embedUrl && (
          <SlidesPlayer
            isOpen={isPlayerOpen}
            onClose={() => setIsPlayerOpen(false)}
            embedUrl={embedUrl}
            title={presentation.title}
            googleSlidesUrl={presentation.googleSlidesUrl || undefined}
          />
        )}
        </div>
        </div>
      </div>
    </div>
  );
}

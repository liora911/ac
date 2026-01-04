"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Presentation } from "@/types/Presentations/presentations";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import dynamic from "next/dynamic";
import RichContent from "@/components/RichContent";

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
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
  const isAuthor = presentation?.author.email === session?.user?.email;

  const total = presentation?.imageUrls.length ?? 0;
  const hasGoogleSlidesUrl = Boolean(presentation?.googleSlidesUrl);
  const hasPdfUrl = Boolean(presentation?.pdfUrl);
  const { embedUrl } = getGoogleSlidesEmbedAndPdfUrls(
    hasGoogleSlidesUrl ? (presentation!.googleSlidesUrl as string) : undefined
  );

  const next = () => setCurrentImageIndex((i) => (i + 1) % total);
  const prev = () => setCurrentImageIndex((i) => (i - 1 + total) % total);

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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 text-slate-900 py-10 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        {}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/presentations")}
            className="bg-white/80 text-slate-800 border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-white hover:border-indigo-300 hover:text-indigo-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            ← {t("presentationDetail.backToPresentations")}
          </button>
          {/* {isAuthorized && isAuthor && (
            <button
              onClick={() => router.push(`/edit-presentation/${id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              ✏️ {t("presentationDetail.editButton")}
            </button>
          )} */}
        </div>

        {}
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-8 text-center tracking-tight">
          {presentation.title}
        </h1>

        {hasGoogleSlidesUrl && (
          <div className="mb-8 flex flex-col items-center gap-4">
            {embedUrl && (
              <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md">
                <iframe
                  src={embedUrl}
                  title={presentation.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            )}
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

        {presentation.imageUrls.length > 0 && (
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

                {}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {currentImageIndex + 1} / {total}
                </div>
              </>
            )}
          </div>
        )}

        {}
        {total > 1 && (
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

        {/* Description */}
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {t("presentationDetail.descriptionTitle")}
          </h2>
          <RichContent content={presentation.description} className="text-slate-700" />
        </div>

        {/* Content */}
        <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {t("presentationDetail.contentTitle")}
          </h2>
          <RichContent content={presentation.content} className="text-slate-700" />
        </div>

        {}
        <div className="mt-8 text-center text-slate-500">
          <p className="text-xs mt-1 text-slate-400">
            {t("presentationDetail.categoryLabel")}:{" "}
            {presentation.category.name} •{" "}
            {t("presentationDetail.createdAtLabel")}:{" "}
            {new Date(presentation.createdAt).toLocaleDateString(dateLocale)}
          </p>
        </div>

        {}
        {isModalOpen && (
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

              {}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-md z-10 cursor-pointer transition-colors border border-slate-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

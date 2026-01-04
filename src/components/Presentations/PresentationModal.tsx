"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Presentation } from "@/types/Presentations/presentations";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import RichContent from "@/components/RichContent";

interface PresentationModalProps {
  presentation: Presentation | null;
  onClose: () => void;
}

/**
 * Given a Google Slides URL, build an embeddable URL and a direct PDF export URL (when possible).
 */
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

const PresentationModal: React.FC<PresentationModalProps> = ({
  presentation,
  onClose,
}) => {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const { showSuccess, showError, showWarning } = useNotification();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!presentation) return null;

  const total = presentation.imageUrls.length;
  const hasGoogleSlidesUrl = Boolean(presentation.googleSlidesUrl);

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/presentations/${presentation.id}`
      : `/presentations/${presentation.id}`;

  const { embedUrl, pdfUrl } = getGoogleSlidesEmbedAndPdfUrls(
    presentation.googleSlidesUrl
  );

  const next = () => setCurrentImageIndex((i) => (i + 1) % Math.max(total, 1));
  const prev = () =>
    setCurrentImageIndex(
      (i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1)
    );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      showSuccess("קישור למצגת הועתק");
      setIsShareModalOpen(false);
    } catch (error) {
      showError("שגיאה בהעתקת הקישור");
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      showWarning("לא ניתן ליצור PDF עבור קישור המצגת הזה");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer transition-colors z-10"
        >
          &times;
        </button>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            {presentation.title}
          </h1>

          {hasGoogleSlidesUrl && (
            <div className="mb-6">
              <div className="mb-3 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300"
                >
                  <span>🔗 Share</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <span>📄 Download PDF</span>
                </button>
                <a
                  href={presentation.googleSlidesUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <span>Open in Google Slides</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>

              {embedUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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

          {presentation.imageUrls.length > 0 && (
            <div className="mb-6">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={presentation.imageUrls[currentImageIndex]}
                  alt={`${presentation.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                />

                {total > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prev();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 shadow-lg z-10 cursor-pointer transition-colors"
                    >
                      &#8592;
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        next();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 shadow-lg z-10 cursor-pointer transition-colors"
                    >
                      &#8594;
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {total}
                    </div>
                  </>
                )}
              </div>

              {total > 1 && (
                <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                  {presentation.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                        index === currentImageIndex
                          ? "border-blue-400"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description
            </h2>
            <RichContent content={presentation.description} className="text-gray-700" />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Content
            </h2>
            <RichContent content={presentation.content} className="text-gray-700" />
          </div>

          <div className="text-center text-gray-500 border-t border-gray-200 pt-6">
            <p>
              Created by:{" "}
              {presentation.author.name || presentation.author.email}
            </p>
            <p className="text-sm mt-1">
              Category: {presentation.category.name} • Created:{" "}
              {new Date(presentation.createdAt).toLocaleDateString(dateLocale)}
            </p>
          </div>
        </div>

        {isShareModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Share this presentation
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Copy the link below to share this presentation.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationModal;

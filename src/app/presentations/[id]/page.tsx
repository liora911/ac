"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Presentation } from "@/types/Presentations/presentations";

export default function PresentationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const total = presentation?.imageUrls.length ?? 0;

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
      } catch (err: any) {
        setError(err.message);
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
      <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl">טוען מצגת...</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">שגיאה</h1>
          <p className="text-gray-300 mb-6">{error || "המצגת לא נמצאה"}</p>
          <button
            onClick={() => router.push("/presentations")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזור למצגות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/presentations")}
          className="mb-6 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          ← חזור למצגות
        </button>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-400 mb-6 text-center">
          {presentation.title}
        </h1>

        {/* Image Carousel */}
        {presentation.imageUrls.length > 0 && (
          <div
            className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden bg-gray-800 cursor-zoom-in shadow-lg"
            onClick={() => setIsModalOpen(true)}
          >
            <Image
              src={presentation.imageUrls[currentImageIndex]}
              alt={`${presentation.title} - תמונה ${currentImageIndex + 1}`}
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 shadow-lg z-10 cursor-pointer transition-colors"
                >
                  &#8592;
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 shadow-lg z-10 cursor-pointer transition-colors"
                >
                  &#8594;
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {total}
                </div>
              </>
            )}
          </div>
        )}

        {/* Thumbnail Navigation */}
        {total > 1 && (
          <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {presentation.imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex
                    ? "border-blue-400"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                <Image
                  src={url}
                  alt={`תמונה ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">תיאור</h2>
          <p className="text-gray-300 whitespace-pre-line leading-relaxed">
            {presentation.description}
          </p>
        </div>

        {/* Content */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">תוכן המצגת</h2>
          <div className="text-gray-300 whitespace-pre-line leading-relaxed">
            {presentation.content}
          </div>
        </div>

        {/* Author Info */}
        <div className="mt-8 text-center text-gray-400">
          <p>
            נוצר על ידי: {presentation.author.name || presentation.author.email}
          </p>
          <p className="text-sm mt-1">
            קטגוריה: {presentation.category.name} • נוצר ב:{" "}
            {new Date(presentation.createdAt).toLocaleDateString("he-IL")}
          </p>
        </div>

        {/* Modal for Full Screen Image */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 cursor-zoom-out"
            onClick={() => setIsModalOpen(false)}
          >
            <div className="relative w-full max-w-6xl h-[90vh]">
              <Image
                src={presentation.imageUrls[currentImageIndex]}
                alt="תצוגה מלאה"
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-4 shadow-lg z-10 cursor-pointer transition-colors text-2xl"
                  >
                    &#8592;
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-4 shadow-lg z-10 cursor-pointer transition-colors text-2xl"
                  >
                    &#8594;
                  </button>
                </>
              )}

              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 shadow-lg z-10 cursor-pointer transition-colors"
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

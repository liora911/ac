"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Presentation } from "@/types/Presentations/presentations";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface PresentationModalProps {
  presentation: Presentation | null;
  onClose: () => void;
}

const PresentationModal: React.FC<PresentationModalProps> = ({
  presentation,
  onClose,
}) => {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!presentation) return null;

  const total = presentation.imageUrls.length;

  const next = () => setCurrentImageIndex((i) => (i + 1) % total);
  const prev = () => setCurrentImageIndex((i) => (i - 1 + total) % total);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer transition-colors z-10"
        >
          &times;
        </button>

        <div className="p-6">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {presentation.title}
          </h1>

          {/* Images */}
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

          {/* Description */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description
            </h2>
            <div
              className="text-gray-700 prose prose-sm max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: presentation.description }}
            />
          </div>

          {/* Content */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Content
            </h2>
            <div
              className="text-gray-700 prose prose-sm max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: presentation.content }}
            />
          </div>

          {/* Footer */}
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
      </div>
    </div>
  );
};

export default PresentationModal;

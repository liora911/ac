"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { presentations } from "@/constants/Presentations/data";

export default function PresentationDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const presentation = useMemo(
    () => presentations.find((p) => p.id === id),
    [id]
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const total = presentation?.imageUrls.length ?? 0;

  const next = () => setCurrentImageIndex((i) => (i + 1) % total);
  const prev = () => setCurrentImageIndex((i) => (i - 1 + total) % total);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!presentation) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Presentation not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-6 text-center">
        {presentation.title}
      </h1>

      <div
        className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden bg-dark-700 cursor-zoom-in"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={presentation.imageUrls[currentImageIndex]}
          alt={`${presentation.title} - image ${currentImageIndex + 1}`}
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
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md z-10 cursor-pointer"
            >
              &#8592;
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md z-10 cursor-pointer"
            >
              &#8594;
            </button>
          </>
        )}
      </div>

      <p className="text-md sm:text-lg text-gray-700 mb-6 whitespace-pre-line">
        {presentation.description}
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 whitespace-pre-line text-sm sm:text-base text-gray-800">
        {presentation.content}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-zoom-out"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative w-full max-w-5xl h-[90vh]">
            <Image
              src={presentation.imageUrls[currentImageIndex]}
              alt="Preview"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}

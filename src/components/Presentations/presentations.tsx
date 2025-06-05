"use client";

import { presentations } from "@/constants/Presentations/data";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Presentations() {
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter();
  const handleCardClick = (presentationId: string) => {
    router.push(`/presentation?id=${presentationId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 sm:mb-12 leading-relaxed text-center max-w-3xl mx-auto">
        {t("presentations.title")}
      </p>

      <h2 className="text-2xl sm:text-3xl font-semibold text-blue-700 mb-6 sm:mb-8 text-center">
        Presentations
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {presentations.map((presentation) => (
          <div
            key={presentation.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 duration-300 ease-in-out"
            onClick={() => handleCardClick(presentation.id)}
          >
            <div className="relative h-48 sm:h-56 w-full">
              <Image
                src={presentation.imageUrls[0]}
                alt={presentation.title}
                layout="fill"
                objectFit="cover"
                className="transition-opacity duration-300 ease-in-out hover:opacity-90"
              />
            </div>
            <div className="p-4 sm:p-6">
              <h3 className="text-md sm:text-lg font-semibold text-blue-600 mb-2">
                {presentation.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {presentation.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

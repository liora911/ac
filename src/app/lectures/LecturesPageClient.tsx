"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { CategoryDef } from "@/types/Lectures/lectures";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

// Lazy load heavy components
const Lectures = dynamic(() => import("@/components/Lectures/Lectures"), {
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  ),
});
const CreateLectureForm = dynamic(
  () => import("@/components/CreateLecture/create_lecture"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    ),
  }
);

interface LecturesPageClientProps {
  lectureCategoriesData: CategoryDef[];
  isAuthorized: boolean;
}

const LecturesPageClient: React.FC<LecturesPageClientProps> = ({
  lectureCategoriesData,
  isAuthorized,
}) => {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>("Banner Image");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (currentBannerUrl !== null) {
      localStorage.setItem("selectedLectureBannerUrl", currentBannerUrl);
    } else {
      localStorage.removeItem("selectedLectureBannerUrl");
    }
  }, [currentBannerUrl]);

  useEffect(() => {
    localStorage.setItem("selectedLectureBannerAlt", currentBannerAlt);
  }, [currentBannerAlt]);

  const handleBannerUpdate = (imageUrl: string | null) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt("Banner Image");
  };

  const handleLectureCreated = () => {
    // Refresh the page to get new data from server
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">
            {t("lecturesPage.title")}
          </h1>
          {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold rtl cursor-pointer"
            >
              {showCreateForm
                ? t("lecturesPage.cancelButton")
                : t("lecturesPage.createLectureButton")}
            </button>
          )}
        </div>

        {showCreateForm && isAuthorized && (
          <div className="mb-8">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              }
            >
              <CreateLectureForm onSuccess={handleLectureCreated} />
            </Suspense>
          </div>
        )}

        <div className="mb-10 h-48 sm:h-64 md:h-80 bg-white rounded-lg shadow-md flex items-center justify-center border border-gray-200 overflow-hidden">
          {currentBannerUrl ? (
            <Image
              src={currentBannerUrl}
              alt={currentBannerAlt}
              width={1200}
              height={320}
              className="object-cover w-full h-full"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
            />
          ) : (
            <p className="text-gray-400 text-xl">
              {t("lecturesPage.bannerPlaceholder")}
            </p>
          )}
        </div>

        {lectureCategoriesData && (
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            }
          >
            <Lectures
              onBannerUpdate={handleBannerUpdate}
              lectureData={lectureCategoriesData}
              viewMode="grid"
            />
          </Suspense>
        )}

        {!lectureCategoriesData ||
          (lectureCategoriesData.length === 0 && (
            <p className="text-center text-xl text-gray-400">
              {t("lecturesPage.noLecturesFound")}
            </p>
          ))}
      </div>
    </div>
  );
};

export default LecturesPageClient;

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { CategoryDef } from "@/types/Lectures/lectures";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

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

const LecturesPage = () => {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>("Banner Image");
  const [lectureCategoriesData, setLectureCategoriesData] = useState<
    CategoryDef[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchLectureData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lectures");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch lectures: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: CategoryDef[] = await response.json();
        setLectureCategoriesData(data);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        setLectureCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectureData();
  }, []);

  const handleBannerUpdate = (imageUrl: string | null) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt("Banner Image");
  };

  const handleLectureCreated = () => {
    const fetchLectureData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lectures");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch lectures: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: CategoryDef[] = await response.json();
        setLectureCategoriesData(data);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        setLectureCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectureData();
    setShowCreateForm(false);
  };

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

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
          {/* {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold rtl cursor-pointer"
            >
              {showCreateForm
                ? t("lecturesPage.cancelButton")
                : t("lecturesPage.createLectureButton")}
            </button>
          )} */}
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

        <div className="relative mb-10 h-48 sm:h-64 md:h-80 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 h-full w-full flex items-center justify-center">
              <p className="text-gray-400 text-xl">
                {t("lecturesPage.bannerLoading")}
              </p>
            </div>
          ) : (
            <Image
              src={currentBannerUrl || "/lecture.jpg"}
              alt={currentBannerAlt}
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              quality={85}
            />
          )}
        </div>
        {isLoading && (
          <div className="flex flex-col md:flex-row gap-8 p-4 md:p-6 bg-white text-gray-900 min-h-[calc(100vh-200px)]">
            <aside className="w-full md:w-1/4 lg:w-1/5 bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-5/6"></div>
                <div className="h-8 bg-gray-200 rounded w-4/5"></div>
              </div>
            </aside>
            <main className="w-full md:w-3/4 lg:w-4/5">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 h-64 animate-pulse"
                  >
                    <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}
        {error && (
          <p className="text-center text-xl text-red-500">
            {t("lecturesPage.errorPrefix")}: {error}
          </p>
        )}
        {!isLoading && !error && lectureCategoriesData && (
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
        {!isLoading &&
          !error &&
          (!lectureCategoriesData || lectureCategoriesData.length === 0) && (
            <p className="text-center text-xl text-gray-400">
              {t("lecturesPage.noLecturesFound")}
            </p>
          )}
      </div>
    </div>
  );
};

export default LecturesPage;

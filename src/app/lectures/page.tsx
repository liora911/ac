"use client";

import React, { useState, useEffect } from "react";
import Lectures from "@/components/Lectures/Lectures";
import Image from "next/image";
import { CategoryDef } from "@/types/Lectures/lectures";

const LecturesPage = () => {
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>("Banner Image");
  const [lectureCategoriesData, setLectureCategoriesData] = useState<
    CategoryDef[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        console.error("Error fetching lecture data:", err);
        setError(err.message || "An unknown error occurred");
        setLectureCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectureData();
  }, []);

  const handleBannerUpdate = (imageUrl: string | null, altText: string) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt(altText || "Banner Image");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: "rtl" }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6 text-white">
          הרצאות בנושאים שונים לפי קטגוריות
        </h1>
        <div className="mb-10 h-48 sm:h-64 md:h-80 bg-gray-700 rounded-lg shadow-xl flex items-center justify-center border border-gray-600 overflow-hidden">
          {currentBannerUrl ? (
            <Image
              src={currentBannerUrl}
              alt={currentBannerAlt}
              width={1200}
              height={320}
              className="object-cover w-full h-full"
              priority
            />
          ) : (
            <p className="text-gray-400 text-xl">
              {isLoading ? "טוען באנר..." : "תמונה/באנר של ההרצאות יופיע כאן"}
            </p>
          )}
        </div>
        {isLoading && (
          <p className="text-center text-xl text-gray-300">טוען הרצאות...</p>
        )}
        {error && (
          <p className="text-center text-xl text-red-500">
            שגיאה בטעינת הרצאות: {error}
          </p>
        )}
        {!isLoading && !error && lectureCategoriesData && (
          <Lectures
            onBannerUpdate={handleBannerUpdate}
            lectureData={lectureCategoriesData}
          />
        )}
        {!isLoading &&
          !error &&
          (!lectureCategoriesData || lectureCategoriesData.length === 0) && (
            <p className="text-center text-xl text-gray-400">
              לא נמצאו הרצאות.
            </p>
          )}
      </div>
    </div>
  );
};

export default LecturesPage;

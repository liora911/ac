"use client";

import { Category, Lecture } from "@/types/Lectures/lectures";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Modal from "@/components/Modal/Modal";
import LecturesSidebar from "./LecturesSidebar";
import LectureCard from "./LectureCard";
import LectureModal from "./LectureModal";
import { Grid3X3, List } from "lucide-react";

interface LecturesProps {
  onBannerUpdate: (_imageUrl: string | null) => void;
  lectureData: Category[];
  viewMode?: "grid" | "list";
}

const Lectures: React.FC<LecturesProps> = ({
  onBannerUpdate,
  lectureData,
  viewMode: initialViewMode = "grid",
}) => {
  const { locale } = useTranslation();
  const hasInitializedRef = useRef(false);
  const [selectedLectures, setSelectedLectures] = useState<Lecture[]>([]);
  const [currentCategoryBanner, setCurrentCategoryBanner] = useState<
    string | null
  >(null);
  const [selectedCategoryName, setSelectedCategoryName] =
    useState<string>("טוען הרצאות...");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

  const handleSelectCategory = (category: Category) => {
    setSelectedLectures(category.lectures);
    setSelectedCategoryName(category.name);
    const bannerUrl = category.bannerImageUrl || null;
    setCurrentCategoryBanner(bannerUrl);
    onBannerUpdate(bannerUrl);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  useEffect(() => {
    if (!lectureData || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    if (lectureData.length === 0) {
      setSelectedLectures([]);
      onBannerUpdate(null);
      setCurrentCategoryBanner(null);
      setSelectedCategoryName("אין הרצאות זמינות");
      return;
    }

    const categoriesWithLectures = lectureData.filter(
      (category) => category.lectures.length > 0
    );

    if (categoriesWithLectures.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * categoriesWithLectures.length
      );
      const randomCategory = categoriesWithLectures[randomIndex];

      setSelectedLectures(randomCategory.lectures);
      setSelectedCategoryName(randomCategory.name);
      setSelectedCategoryId(randomCategory.id);
      const initialBanner = randomCategory.bannerImageUrl || null;
      setCurrentCategoryBanner(initialBanner);
      onBannerUpdate(initialBanner);
    } else {
      setSelectedLectures([]);
      setSelectedCategoryName("אין הרצאות זמינות");
      onBannerUpdate(null);
      setCurrentCategoryBanner(null);
    }
  }, [lectureData, onBannerUpdate]);

  const handleLectureClick = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    onBannerUpdate(lecture.bannerImageUrl || currentCategoryBanner || null);
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק הרצאה זו?")) {
      try {
        const response = await fetch(`/api/lectures/${lectureId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete lecture");
        }

        setSelectedLectures((prevLectures) =>
          prevLectures.filter((lecture) => lecture.id !== lectureId)
        );
      } catch {
        setErrorMessage("נכשל במחיקת ההרצאה.");
        setErrorModalOpen(true);
      }
    }
  };

  const handleCloseLectureModal = () => {
    setSelectedLecture(null);
  };

  if (!lectureData) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900 text-slate-400 text-xl">
        טוען נתוני הרצאות...
      </div>
    );
  }

  if (lectureData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900 text-slate-400 text-xl">
        אין הרצאות זמינות כרגע.
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row gap-8 p-4 md:p-6 min-h-[calc(100vh-200px)]"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <LecturesSidebar
        lectureData={lectureData}
        onSelectCategory={handleSelectCategory}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryIdDirectly={setSelectedCategoryId}
      />

      <main className="relative w-full md:w-3/4 lg:w-4/5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-400">
            הרצאות בנושא:{" "}
            <span className="bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {selectedCategoryName}
            </span>
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        {selectedLectures.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedLectures.map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  onLectureClick={handleLectureClick}
                  onDeleteLecture={handleDeleteLecture}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedLectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleLectureClick(lecture)}
                >
                  <div className="flex items-center space-x-4">
                    {lecture.bannerImageUrl && (
                      <Image
                        src={lecture.bannerImageUrl}
                        alt={lecture.title}
                        width={80}
                        height={60}
                        className="object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {lecture.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {lecture.description.replace(/<[^>]*>?/gm, "")}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>
                          By: {lecture.author?.name || lecture.author?.email}
                        </span>
                        <span>Duration: {lecture.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-gray-400 text-lg">
            אנא בחר קטגוריה כדי להציג הרצאות, או שאין הרצאות זמינות בקטגוריה זו.
          </p>
        )}

        <LectureModal
          lecture={selectedLecture}
          onClose={handleCloseLectureModal}
        />
        {errorModalOpen && (
          <Modal
            isOpen={errorModalOpen}
            onClose={() => setErrorModalOpen(false)}
            title="שגיאה"
            message={errorMessage}
            confirmText="סגור"
          />
        )}
      </main>
    </div>
  );
};

export default Lectures;

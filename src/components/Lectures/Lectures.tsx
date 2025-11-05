"use client";

import { Category, Lecture } from "@/types/Lectures/lectures";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Modal from "@/components/Modal/Modal";
import LecturesSidebar from "./LecturesSidebar";
import LectureCard from "./LectureCard";
import LectureModal from "./LectureModal";

interface LecturesProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  lectureData: Category[];
}

const Lectures: React.FC<LecturesProps> = ({ onBannerUpdate, lectureData }) => {
  const { data: session } = useSession();
  const router = useRouter();
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

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const handleSelectCategory = (category: Category) => {
    setSelectedLectures(category.lectures);
    setSelectedCategoryName(category.name);
    const bannerUrl = category.bannerImageUrl || null;
    setCurrentCategoryBanner(bannerUrl);
    onBannerUpdate(bannerUrl, category.name);
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
      onBannerUpdate(null, "הרצאות");
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
      onBannerUpdate(initialBanner, randomCategory.name);
    } else {
      setSelectedLectures([]);
      setSelectedCategoryName("אין הרצאות זמינות");
      onBannerUpdate(null, "הרצאות");
      setCurrentCategoryBanner(null);
    }
  }, [lectureData, onBannerUpdate]);

  const handleLectureClick = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    onBannerUpdate(
      lecture.bannerImageUrl || currentCategoryBanner || null,
      lecture.title
    );
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

        // Update the state to remove the deleted lecture
        setSelectedLectures((prevLectures) =>
          prevLectures.filter((lecture) => lecture.id !== lectureId)
        );

        // Optionally, refresh the entire lecture data if needed
        // router.refresh();
      } catch (error) {
        console.error("Error deleting lecture:", error);
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
        <h2 className="text-3xl font-bold mb-6 text-cyan-300">
          הרצאות בנושא:{" "}
          <span className="text-teal-400">{selectedCategoryName}</span>
        </h2>
        {selectedLectures.length > 0 ? (
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

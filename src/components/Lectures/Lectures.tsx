"use client";

import {
  Category,
  CategoryTreeProps,
  Lecture,
} from "@/types/Lectures/lectures";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import Modal from "@/components/Modal/Modal";

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onSelectCategory,
  level = 0,
  expandedCategories,
  toggleCategory,
  selectedCategoryId,
  setSelectedCategoryIdDirectly,
}) => {
  return (
    <ul className={`ml-${level * 4} space-y-1`}>
      {categories.map((category) => (
        <li key={category.id}>
          <div
            className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors ${
              selectedCategoryId === category.id
                ? "bg-green-600 text-white"
                : "bg-gray-800"
            }`}
          >
            <span
              className="flex-grow font-medium cursor-pointer"
              onClick={() => {
                onSelectCategory(category);
                setSelectedCategoryIdDirectly(category.id);
              }}
            >
              {category.name} ({category.lectures.length})
            </span>
            {category.subcategories && category.subcategories.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent category selection when clicking the toggle
                  toggleCategory(category.id);
                }}
                className="ml-2 p-1 rounded-full hover:bg-gray-600 focus:outline-none cursor-pointer"
              >
                <span
                  className={`transform transition-transform ${
                    expandedCategories[category.id] ? "rotate-90" : "rotate-0"
                  }`}
                >
                  ▶
                </span>
              </button>
            )}
          </div>
          {category.subcategories && expandedCategories[category.id] && (
            <CategoryTree
              categories={category.subcategories}
              onSelectCategory={onSelectCategory}
              level={level + 1}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryIdDirectly={setSelectedCategoryIdDirectly}
            />
          )}
        </li>
      ))}
    </ul>
  );
};

interface LecturesProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  lectureData: Category[];
}

const Lectures: React.FC<LecturesProps> = ({ onBannerUpdate, lectureData }) => {
  const { data: session } = useSession();
  const router = useRouter();
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
      <div
        className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl"
        style={{ direction: "rtl" }}
      >
        טוען נתוני הרצאות...
      </div>
    );
  }

  if (lectureData.length === 0) {
    return (
      <div
        className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl"
        style={{ direction: "rtl" }}
      >
        אין הרצאות זמינות כרגע.
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row gap-8 p-4 md:p-6 bg-gray-900 text-gray-100 min-h-[calc(100vh-200px)]"
      style={{ direction: "rtl" }}
    >
      <aside className="w-full md:w-1/4 lg:w-1/5 bg-gray-850 p-4 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">
          קטגוריות
        </h3>
        <CategoryTree
          categories={lectureData}
          onSelectCategory={handleSelectCategory}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryIdDirectly={setSelectedCategoryId}
        />
      </aside>

      <main className="w-full md:w-3/4 lg:w-4/5">
        <h2 className="text-3xl font-bold mb-6 text-white">
          הרצאות בנושא:{" "}
          <span className="text-green-400">{selectedCategoryName}</span>
        </h2>
        {selectedLectures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedLectures.map((lecture) => {
              const isAuthor = lecture.author?.email === session?.user?.email;
              return (
                <div
                  key={lecture.id}
                  className="bg-gray-800 rounded-lg shadow-md border border-gray-700 hover:shadow-green-500/30 transition-shadow cursor-pointer flex flex-col"
                >
                  {lecture.bannerImageUrl && (
                    <div className="relative h-40 w-full">
                      <img
                        src={lecture.bannerImageUrl}
                        alt={lecture.title}
                        className="object-cover w-full h-full rounded-t-lg"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-grow">
                    <h4 className="text-xl font-semibold text-green-400 mb-2">
                      {lecture.title}
                    </h4>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                      {lecture.description.replace(/<[^>]*>?/gm, "")}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
                      <span>משך: {lecture.duration}</span>
                      {lecture.date && <span>תאריך: {lecture.date}</span>}
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <button
                      onClick={() => handleLectureClick(lecture)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold cursor-pointer"
                    >
                      צפה בהרצאה
                    </button>
                    {isAuthorized && isAuthor && (
                      <div className="flex space-x-2">
                        {" "}
                        {/* Added a div to wrap buttons */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/edit-lecture/${lecture.id}`);
                          }}
                          className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm cursor-pointer"
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLecture(lecture.id);
                          }}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer"
                        >
                          🗑️ מחק
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-lg">
            אנא בחר קטגוריה כדי להציג הרצאות, או שאין הרצאות זמינות בקטגוריה זו.
          </p>
        )}

        {/* Lecture Modal */}
        {selectedLecture && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
              <button
                onClick={handleCloseLectureModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
              <h3 className="text-3xl font-bold text-green-400 mb-4">
                {selectedLecture.title}
              </h3>
              {selectedLecture.videoUrl && (
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <iframe
                    src={selectedLecture.videoUrl}
                    title={selectedLecture.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded w-full h-full"
                  ></iframe>
                </div>
              )}
              <div
                className="text-gray-300 prose prose-invert prose-sm max-w-none mb-4"
                dangerouslySetInnerHTML={{
                  __html: selectedLecture.description,
                }}
              />
              <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-700 pt-4">
                <span>משך: {selectedLecture.duration}</span>
                {selectedLecture.date && (
                  <span>תאריך: {selectedLecture.date}</span>
                )}
              </div>
            </div>
          </div>
        )}
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

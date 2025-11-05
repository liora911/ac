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
    <ul className={`ml-${level * 4} space-y-2`}>
      {categories.map((category) => (
        <li key={category.id}>
          <div
            className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 ${
              selectedCategoryId === category.id
                ? "bg-cyan-600/20 text-cyan-200 border border-cyan-500/30"
                : "bg-slate-800/50 text-slate-300 hover:text-cyan-300"
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
                className="ml-2 p-1 rounded-full hover:bg-slate-600/50 focus:outline-none cursor-pointer transition-colors"
              >
                <span
                  className={`transform transition-transform text-cyan-400 ${
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
        className="flex justify-center items-center h-64 bg-slate-900 text-slate-400 text-xl"
        style={{ direction: "rtl" }}
      >
        טוען נתוני הרצאות...
      </div>
    );
  }

  if (lectureData.length === 0) {
    return (
      <div
        className="flex justify-center items-center h-64 bg-slate-900 text-slate-400 text-xl"
        style={{ direction: "rtl" }}
      >
        אין הרצאות זמינות כרגע.
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row gap-8 p-4 md:p-6 bg-slate-900 text-slate-100 min-h-[calc(100vh-200px)] relative overflow-hidden"
      style={{ direction: "rtl" }}
    >
      {/* Cosmic background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-90"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>

      <aside className="relative w-full md:w-1/4 lg:w-1/5 bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-700/50">
        <h3 className="text-xl font-semibold mb-4 text-cyan-300 border-b border-slate-600 pb-2">
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

      <main className="relative w-full md:w-3/4 lg:w-4/5">
        <h2 className="text-3xl font-bold mb-6 text-cyan-300">
          הרצאות בנושא:{" "}
          <span className="text-teal-400">{selectedCategoryName}</span>
        </h2>
        {selectedLectures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedLectures.map((lecture) => {
              const isAuthor = lecture.author?.email === session?.user?.email;
              return (
                <div
                  key={lecture.id}
                  className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden group"
                >
                  {lecture.bannerImageUrl && (
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={lecture.bannerImageUrl}
                        alt={lecture.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-4 flex-grow">
                    <h4 className="text-xl font-semibold text-cyan-300 mb-2 group-hover:text-cyan-200 transition-colors">
                      {lecture.title}
                    </h4>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-3">
                      {lecture.description.replace(/<[^>]*>?/gm, "")}
                    </p>
                    <div className="flex justify-between items-center text-xs text-slate-400 mt-auto">
                      <span>משך: {lecture.duration}</span>
                      {lecture.date && <span>תאריך: {lecture.date}</span>}
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-700/50 flex justify-between items-center">
                    <button
                      onClick={() => handleLectureClick(lecture)}
                      className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-500 transition-colors text-sm font-semibold cursor-pointer shadow-lg hover:shadow-cyan-500/25"
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
                          className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-500 transition-colors text-sm cursor-pointer"
                        >
                          ✏️ ערוך
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLecture(lecture.id);
                          }}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-500 transition-colors text-sm cursor-pointer"
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
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
              <button
                onClick={handleCloseLectureModal}
                className="absolute top-3 right-3 text-slate-400 hover:text-cyan-300 text-2xl font-bold cursor-pointer transition-colors"
              >
                &times;
              </button>
              <h3 className="text-3xl font-bold text-cyan-300 mb-4">
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
                    className="rounded-lg w-full h-full shadow-lg"
                  ></iframe>
                </div>
              )}
              <div
                className="text-slate-300 prose prose-invert prose-sm max-w-none mb-4"
                dangerouslySetInnerHTML={{
                  __html: selectedLecture.description,
                }}
              />
              <div className="flex justify-between items-center text-sm text-slate-400 border-t border-slate-700/50 pt-4">
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

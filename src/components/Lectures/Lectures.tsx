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
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors
                        ${
                          selectedCategoryId === category.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800"
                        }`}
            onClick={() => {
              if (category.subcategories && category.subcategories.length > 0) {
                toggleCategory(category.id);
              }
              onSelectCategory(category);
              setSelectedCategoryIdDirectly(category.id);
            }}
          >
            <span className="font-medium">
              {category.name} ({category.lectures.length})
            </span>
            {category.subcategories && category.subcategories.length > 0 && (
              <span
                className={`transform transition-transform ${
                  expandedCategories[category.id] ? "rotate-90" : "rotate-0"
                }`}
              >
                ▶
              </span>
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

    setSelectedLectures([]);
    setSelectedCategoryName("בחר קטגוריה מהתפריט");

    const firstCategory = lectureData[0];
    const initialBanner = firstCategory?.bannerImageUrl || null;
    setCurrentCategoryBanner(initialBanner);
    onBannerUpdate(initialBanner, firstCategory?.name || "הרצאות");
  }, [lectureData, onBannerUpdate]);

  const handleLectureClick = (lecture: Lecture) => {
    onBannerUpdate(
      lecture.bannerImageUrl || currentCategoryBanner || null,
      lecture.title
    );
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
          <span className="text-blue-400">{selectedCategoryName}</span>
        </h2>
        {selectedLectures.length > 0 ? (
          <div className="space-y-6">
            {selectedLectures.map((lecture) => {
              const isAuthor = lecture.author?.email === session?.user?.email;
              return (
                <div
                  key={lecture.id}
                  className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-blue-500/30 transition-shadow cursor-pointer"
                  onClick={() => handleLectureClick(lecture)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-2xl font-semibold text-blue-400">
                      {lecture.title}
                    </h4>
                    {isAuthorized && isAuthor && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/edit-lecture/${lecture.id}`);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        ✏️ ערוך
                      </button>
                    )}
                  </div>
                  <div
                    className="text-gray-300 mb-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: lecture.description }}
                  />
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>משך: {lecture.duration}</span>
                    {lecture.date && <span>תאריך: {lecture.date}</span>}
                  </div>
                  {lecture.videoUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">צפה בהרצאה:</p>
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          src={lecture.videoUrl}
                          title={lecture.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded"
                        ></iframe>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-lg">
            אנא בחר קטגוריה כדי להציג הרצאות, או שאין הרצאות זמינות בקטגוריה זו.
          </p>
        )}
      </main>
    </div>
  );
};

export default Lectures;

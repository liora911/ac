"use client";

import { Category, Lecture } from "@/types/Lectures/lectures";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Modal from "@/components/Modal/Modal";
import LecturesSidebar from "./LecturesSidebar";
import LectureCard from "./LectureCard";
import LectureModal from "./LectureModal";
import { Grid3X3, List, AlertTriangle, Trash2, Search, X } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface LecturesProps {
  onBannerUpdate: (_imageUrl: string | null, _categoryName?: string) => void;
  lectureData: Category[];
  viewMode?: "grid" | "list";
}

const Lectures: React.FC<LecturesProps> = ({
  onBannerUpdate,
  lectureData,
  viewMode: initialViewMode = "grid",
}) => {
  const { locale, t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const hasInitializedRef = useRef(false);
  const [selectedLectures, setSelectedLectures] = useState<Lecture[]>([]);
  const [currentCategoryBanner, setCurrentCategoryBanner] = useState<
    string | null
  >(null);
  const [selectedCategoryName, setSelectedCategoryName] =
    useState<string>("");
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Debounce search query by 3 seconds
  const debouncedSearchQuery = useDebounce(searchQuery, 3000);

  // Get all lectures from all categories for search
  const allLectures = useMemo(() => {
    const lectures: (Lecture & { categoryName: string })[] = [];
    const collectLectures = (categories: Category[]) => {
      for (const category of categories) {
        for (const lecture of category.lectures) {
          lectures.push({ ...lecture, categoryName: category.name });
        }
        if (category.subcategories) {
          collectLectures(category.subcategories);
        }
      }
    };
    collectLectures(lectureData);
    return lectures;
  }, [lectureData]);

  // Filter lectures based on search query for autocomplete (immediate)
  const autocompleteResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allLectures
      .filter((lecture) =>
        lecture.title.toLowerCase().includes(query) ||
        lecture.description.toLowerCase().includes(query)
      )
      .slice(0, 5); // Limit to 5 suggestions
  }, [searchQuery, allLectures]);

  // Filter lectures based on debounced search query (for main results)
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return null;
    const query = debouncedSearchQuery.toLowerCase();
    return allLectures.filter((lecture) =>
      lecture.title.toLowerCase().includes(query) ||
      lecture.description.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, allLectures]);

  // Handle click outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When debounced search completes, enter search mode
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      setIsSearchMode(true);
      setShowAutocomplete(false);
    }
  }, [debouncedSearchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowAutocomplete(value.trim().length > 0);
    if (!value.trim()) {
      setIsSearchMode(false);
    }
  }, []);

  const handleAutocompleteSelect = useCallback((lecture: Lecture & { categoryName: string }) => {
    setSearchQuery(lecture.title);
    setShowAutocomplete(false);
    setIsSearchMode(true);
    // Show only this lecture in results
    setSelectedLectures([lecture]);
    setSelectedCategoryName(lecture.categoryName);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowAutocomplete(false);
    setIsSearchMode(false);
    // Reset to previously selected category if any
    if (selectedCategoryId) {
      const findCategory = (categories: Category[]): Category | null => {
        for (const cat of categories) {
          if (cat.id === selectedCategoryId) return cat;
          if (cat.subcategories) {
            const found = findCategory(cat.subcategories);
            if (found) return found;
          }
        }
        return null;
      };
      const category = findCategory(lectureData);
      if (category) {
        setSelectedLectures(category.lectures);
        setSelectedCategoryName(category.name);
      }
    }
  }, [selectedCategoryId, lectureData]);

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
      onBannerUpdate(null, undefined);
      setCurrentCategoryBanner(null);
      setSelectedCategoryName("");
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
      setSelectedCategoryName("");
      onBannerUpdate(null, undefined);
      setCurrentCategoryBanner(null);
    }
  }, [lectureData, onBannerUpdate]);

  const handleLectureClick = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    // Pass lecture title when clicking on a lecture, category name when just selecting a category
    onBannerUpdate(lecture.bannerImageUrl || currentCategoryBanner || null, lecture.title);
  };

  const openDeleteModal = (lecture: Lecture) => {
    setLectureToDelete(lecture);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setLectureToDelete(null);
  };

  const confirmDeleteLecture = async () => {
    if (!lectureToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lectures/${lectureToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lecture");
      }

      setSelectedLectures((prevLectures) =>
        prevLectures.filter((lecture) => lecture.id !== lectureToDelete.id)
      );
      showSuccess(t("lectures.deleteSuccess").replace("{title}", lectureToDelete.title));
      closeDeleteModal();
    } catch {
      showError(t("lectures.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLecture = (lectureId: string) => {
    const lecture = selectedLectures.find((l) => l.id === lectureId);
    if (lecture) {
      openDeleteModal(lecture);
    }
  };

  const handleCloseLectureModal = () => {
    setSelectedLecture(null);
  };

  if (!lectureData) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900 text-slate-400 text-xl">
        {t("lecturesPage.loadingLectures")}
      </div>
    );
  }

  if (lectureData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900 text-slate-400 text-xl">
        {t("lecturesPage.noLecturesAvailable")}
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
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowAutocomplete(true)}
              placeholder={t("lecturesPage.searchPlaceholder") as string || "Search lectures..."}
              className="w-full ps-10 pe-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute top-1/2 -translate-y-1/2 end-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title={t("lecturesPage.clearSearch") as string || "Clear search"}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteResults.length > 0 && (
            <div
              ref={autocompleteRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              <div className="p-2 text-xs text-gray-500 border-b">
                {t("lecturesPage.suggestions") || "Suggestions"} ({autocompleteResults.length})
              </div>
              {autocompleteResults.map((lecture) => (
                <button
                  key={lecture.id}
                  onClick={() => handleAutocompleteSelect(lecture)}
                  className="w-full px-4 py-3 text-start hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 line-clamp-1">
                    {lecture.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {lecture.categoryName} • {lecture.duration} {t("lecturesPage.minutes")}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Status Indicator - shows when user is typing and debounce hasn't fired yet */}
          {searchQuery && searchQuery !== debouncedSearchQuery && (
            <div className="absolute -bottom-5 start-0 text-xs text-gray-500 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t("lecturesPage.searchWaiting") || "Waiting for you to finish typing..."}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-400">
            {isSearchMode ? (
              <>
                {t("lecturesPage.searchResults") || "Search results for"}{" "}
                <span className="bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  &quot;{debouncedSearchQuery}&quot;
                </span>
                {searchResults && (
                  <span className="text-lg font-normal ms-2">
                    ({searchResults.length} {t("lecturesPage.found") || "found"})
                  </span>
                )}
              </>
            ) : (
              <>
                {t("lecturesPage.lecturesOnTopic")}{" "}
                <span className="bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {selectedCategoryName || t("lecturesPage.noLecturesAvailable")}
                </span>
              </>
            )}
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
        {/* Display lectures - either search results or category lectures */}
        {(() => {
          const lecturesToDisplay = isSearchMode && searchResults ? searchResults : selectedLectures;

          if (lecturesToDisplay.length > 0) {
            return viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {lecturesToDisplay.map((lecture) => (
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
                {lecturesToDisplay.map((lecture) => (
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
                          <span>{t("lecturesPage.duration")} {lecture.duration} {t("lecturesPage.minutes")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          // No results message
          if (isSearchMode && searchResults && searchResults.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">
                  {t("lecturesPage.noSearchResults") || "No lectures found matching your search"}
                </p>
              </div>
            );
          }

          return (
            <p className="text-gray-400 text-lg">
              {t("lecturesPage.selectCategoryPrompt")}
            </p>
          );
        })()}

        <LectureModal
          lecture={selectedLecture}
          onClose={handleCloseLectureModal}
        />
        {errorModalOpen && (
          <Modal
            isOpen={errorModalOpen}
            onClose={() => setErrorModalOpen(false)}
            title={t("common.error")}
            message={errorMessage}
            confirmText={t("common.close")}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          title={t("admin.lectures.deleteTitle")}
          hideFooter
        >
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("admin.lectures.deleteConfirm")}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {t("admin.lectures.deleteWarning")}
              <span className="font-medium text-gray-900"> &quot;{lectureToDelete?.title}&quot;</span>.
              <br />
              {t("admin.lectures.deleteIrreversible")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                {t("admin.common.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteLecture}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("admin.lectures.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t("admin.lectures.deleteButton")}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default Lectures;

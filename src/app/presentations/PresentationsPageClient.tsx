"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import Image from "next/image";
import dynamic from "next/dynamic";
import { PresentationCategory } from "@/types/Presentations/presentations";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PresentationCategoryTree from "@/components/Presentations/PresentationCategoryTree";

// Lazy load heavy components
const CreatePresentationForm = dynamic(
  () => import("@/components/CreatePresentation/create_presentation"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    ),
  }
);
const Modal = dynamic(() => import("@/components/Modal/Modal"), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded" />,
});

interface PresentationsPageClientProps {
  presentationCategoriesData: PresentationCategory[];
  initialSelectedCategoryId: string | null;
  initialBannerUrl: string | null;
  initialBannerAlt: string;
  isAuthorized: boolean;
}

const PresentationsPageClient: React.FC<PresentationsPageClientProps> = ({
  presentationCategoriesData,
  initialSelectedCategoryId,
  initialBannerUrl,
  initialBannerAlt,
  isAuthorized,
}) => {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(
    initialBannerUrl
  );
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>(initialBannerAlt);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialSelectedCategoryId
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (currentBannerUrl !== null) {
      localStorage.setItem("selectedPresentationBannerUrl", currentBannerUrl);
    } else {
      localStorage.removeItem("selectedPresentationBannerUrl");
    }
  }, [currentBannerUrl]);

  useEffect(() => {
    localStorage.setItem("selectedPresentationBannerAlt", currentBannerAlt);
  }, [currentBannerAlt]);

  const handleBannerUpdate = (imageUrl: string | null, altText: string) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt(altText || "Banner Image");
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    if (categoryId) {
      localStorage.setItem("selectedPresentationCategoryId", categoryId);
    } else {
      localStorage.removeItem("selectedPresentationCategoryId");
    }
  };

  const handlePresentationCreated = () => {
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
            {t("presentationsPage.title")}
          </h1>
          {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold rtl cursor-pointer"
            >
              {showCreateForm
                ? t("presentationsPage.cancelButton")
                : t("presentationsPage.createPresentationButton")}
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
              <CreatePresentationForm onSuccess={handlePresentationCreated} />
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
              {t("presentationsPage.bannerPlaceholder")}
            </p>
          )}
        </div>

        {presentationCategoriesData && (
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            }
          >
            <PresentationsGrid
              categories={presentationCategoriesData}
              onBannerUpdate={handleBannerUpdate}
              initialSelectedCategoryId={selectedCategoryId}
              initialBannerInfo={{
                imageUrl: currentBannerUrl,
                altText: currentBannerAlt,
              }}
              onCategorySelect={handleCategorySelect}
              session={session}
              isAuthorized={isAuthorized}
              onPresentationDeleted={handlePresentationCreated}
              viewMode="grid"
            />
          </Suspense>
        )}

        {!presentationCategoriesData ||
          (presentationCategoriesData.length === 0 && (
            <p className="text-center text-xl text-gray-400">
              {t("presentationsPage.noPresentationsFound")}
            </p>
          ))}
      </div>
    </div>
  );
};

interface PresentationsGridProps {
  categories: PresentationCategory[];
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  initialSelectedCategoryId: string | null;
  initialBannerInfo: { imageUrl: string | null; altText: string } | null;
  onCategorySelect: (categoryId: string | null) => void;
  session: Session | null;
  isAuthorized: boolean;
  onPresentationDeleted: () => void;
  viewMode?: "grid" | "list";
}

const PresentationsGrid: React.FC<PresentationsGridProps> = ({
  categories,
  onBannerUpdate,
  initialSelectedCategoryId,
  initialBannerInfo,
  onCategorySelect,
  session,
  isAuthorized,
  onPresentationDeleted,
  viewMode: initialViewMode = "grid",
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialSelectedCategoryId
  );
  const { t } = useTranslation();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

  const handleDeletePresentation = async (presentationId: string) => {
    if (window.confirm(t("presentationsPage.deleteConfirm"))) {
      try {
        const response = await fetch(`/api/presentations/${presentationId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete presentation");
        }

        onPresentationDeleted();
      } catch (error) {
        setErrorMessage(t("presentationsPage.deleteFailed") as string);
        setErrorModalOpen(true);
      }
    }
  };

  useEffect(() => {
    if (initialSelectedCategoryId && !selectedCategoryId) {
      setSelectedCategoryId(initialSelectedCategoryId);
    }
    if (initialBannerInfo && initialBannerInfo.imageUrl !== null) {
      onBannerUpdate(initialBannerInfo.imageUrl, initialBannerInfo.altText);
    }
  }, [
    initialSelectedCategoryId,
    selectedCategoryId,
    initialBannerInfo,
    onBannerUpdate,
  ]);

  const handleCategoryClick = (category: PresentationCategory) => {
    setSelectedCategoryId(category.id);
    onBannerUpdate(category.bannerImageUrl, category.name);
    onCategorySelect(category.id);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const setSelectedCategoryIdDirectly = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    onCategorySelect(categoryId);
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      onBannerUpdate(category.bannerImageUrl, category.name);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {}
      <div className="lg:col-span-1">
        <div className="p-4 rounded-lg shadow-sm border border-slate-700">
          <h3 className="text-xl font-semibold mb-4 text-grey-300 border-b border-slate-700 pb-2">
            {t("presentationsPage.categoriesTitle")}
          </h3>
          <PresentationCategoryTree
            categories={categories}
            onSelectCategory={handleCategoryClick}
            expandedCategories={expandedCategories}
            toggleCategory={toggleCategory}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryIdDirectly={setSelectedCategoryIdDirectly}
          />
        </div>
      </div>

      {}
      <div className="lg:col-span-3">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {selectedCategory
              ? `${t("presentationsPage.headingWithCategory")} ${
                  selectedCategory.name
                }`
              : t("presentationsPage.heading")}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {selectedCategory && selectedCategory.presentations.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedCategory.presentations.map((presentation) => {
                const isAuthor =
                  presentation.author?.email === session?.user?.email;
                return (
                  <div
                    key={presentation.id}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div
                      onClick={() =>
                        (window.location.href = `/presentations/${presentation.id}`)
                      }
                    >
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        {presentation.title}
                      </h3>
                      <p
                        className="text-gray-700 mb-4 line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: presentation.description,
                        }}
                      />
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          {t("presentationsPage.imagesLabel")}:{" "}
                          {presentation.imageUrls.length}
                        </span>
                        <span>
                          {t("presentationsPage.byLabel")}:{" "}
                          {presentation.author.name ||
                            presentation.author.email}
                        </span>
                      </div>
                    </div>
                    {isAuthorized && isAuthor && (
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePresentation(presentation.id);
                          }}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer"
                        >
                          🗑️ {t("presentationsPage.deleteButton")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedCategory.presentations.map((presentation) => {
                const isAuthor =
                  presentation.author?.email === session?.user?.email;
                return (
                  <div
                    key={presentation.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/presentations/${presentation.id}`)
                    }
                  >
                    <div className="flex items-center space-x-4">
                      {presentation.imageUrls.length > 0 && (
                        <Image
                          src={presentation.imageUrls[0]}
                          alt={presentation.title}
                          width={80}
                          height={60}
                          className="object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {presentation.title}
                        </h3>
                        <p
                          className="text-gray-600 text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: presentation.description,
                          }}
                        />
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>
                            {t("presentationsPage.imagesLabel")}:{" "}
                            {presentation.imageUrls.length}
                          </span>
                          <span>
                            {t("presentationsPage.byLabel")}:{" "}
                            {presentation.author.name ||
                              presentation.author.email}
                          </span>
                        </div>
                      </div>
                      {isAuthorized && isAuthor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePresentation(presentation.id);
                          }}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer"
                        >
                          🗑️ {t("presentationsPage.deleteButton")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : selectedCategory ? (
          <p className="text-gray-500 text-lg">
            {t("presentationsPage.noPresentationsInCategory")}
          </p>
        ) : (
          <p className="text-gray-500 text-lg">
            {t("presentationsPage.selectCategoryPrompt")}
          </p>
        )}
      </div>
      {errorModalOpen && (
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 rounded p-4">
              Loading...
            </div>
          }
        >
          <Modal
            isOpen={errorModalOpen}
            onClose={() => setErrorModalOpen(false)}
            title="שגיאה"
            message={errorMessage}
            confirmText="סגור"
          />
        </Suspense>
      )}
    </div>
  );
};

export default PresentationsPageClient;

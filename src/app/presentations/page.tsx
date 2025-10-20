"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { PresentationCategory } from "@/types/Presentations/presentations";
import CreatePresentationForm from "@/components/CreatePresentation/create_presentation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

const PresentationsPage = () => {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("selectedPresentationBannerUrl") || null;
      }
      return null;
    }
  );
  const [currentBannerAlt, setCurrentBannerAlt] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("selectedPresentationBannerAlt") || "Banner Image"
      );
    }
    return "Banner Image";
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("selectedPresentationCategoryId") || null;
      }
      return null;
    }
  );
  const [presentationCategoriesData, setPresentationCategoriesData] = useState<
    PresentationCategory[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAuthorized: boolean =
    !!session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  useEffect(() => {
    const fetchPresentationData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/presentations");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch presentations: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: PresentationCategory[] = await response.json();
        setPresentationCategoriesData(data);

        // If no category is selected from localStorage, select a random one
        if (!selectedCategoryId && data.length > 0) {
          const categoriesWithPresentations = data.filter(
            (category) => category.presentations.length > 0
          );
          if (categoriesWithPresentations.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * categoriesWithPresentations.length
            );
            const randomCategory = categoriesWithPresentations[randomIndex];
            setSelectedCategoryId(randomCategory.id);
            setCurrentBannerUrl(randomCategory.bannerImageUrl);
            setCurrentBannerAlt(randomCategory.name);
            localStorage.setItem(
              "selectedPresentationCategoryId",
              randomCategory.id
            );
            localStorage.setItem(
              "selectedPresentationBannerUrl",
              randomCategory.bannerImageUrl || ""
            );
            localStorage.setItem(
              "selectedPresentationBannerAlt",
              randomCategory.name
            );
          }
        }
      } catch (err: any) {
        console.error("Error fetching presentation data:", err);
        setError(err.message || "An unknown error occurred");
        setPresentationCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentationData();
  }, []);

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
    const fetchPresentationData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/presentations");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch presentations: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: PresentationCategory[] = await response.json();
        setPresentationCategoriesData(data);
      } catch (err: any) {
        console.error("Error fetching presentation data:", err);
        setError(err.message || "An unknown error occurred");
        setPresentationCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentationData();
    setShowCreateForm(false);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">
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
            <CreatePresentationForm onSuccess={handlePresentationCreated} />
          </div>
        )}

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
              {isLoading
                ? t("presentationsPage.bannerLoading")
                : t("presentationsPage.bannerPlaceholder")}
            </p>
          )}
        </div>

        {isLoading && (
          <p className="text-center text-xl text-gray-300">
            {t("presentationsPage.loading")}
          </p>
        )}
        {error && (
          <p className="text-center text-xl text-red-500">
            {t("presentationsPage.errorPrefix")}: {error}
          </p>
        )}

        {!isLoading && !error && presentationCategoriesData && (
          <PresentationsGrid
            categories={presentationCategoriesData}
            onBannerUpdate={handleBannerUpdate}
            initialSelectedCategoryId={selectedCategoryId}
            initialBannerInfo={{
              imageUrl: currentBannerUrl,
              altText: currentBannerAlt,
            }}
            onCategorySelect={handleCategorySelect}
            session={session} // Pass session
            isAuthorized={isAuthorized} // Pass isAuthorized
            onPresentationDeleted={handlePresentationCreated} // Callback to refresh data
          />
        )}

        {!isLoading &&
          !error &&
          (!presentationCategoriesData ||
            presentationCategoriesData.length === 0) && (
            <p className="text-center text-xl text-gray-400">
              {t("presentationsPage.noPresentationsFound")}
            </p>
          )}
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
  session: any; // Add session to props
  isAuthorized: boolean; // Add isAuthorized to props
  onPresentationDeleted: () => void; // Add callback for deletion
}

const PresentationsGrid: React.FC<PresentationsGridProps> = ({
  categories,
  onBannerUpdate,
  initialSelectedCategoryId,
  initialBannerInfo,
  onCategorySelect,
  session, // Destructure session
  isAuthorized, // Destructure isAuthorized
  onPresentationDeleted, // Destructure onPresentationDeleted
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialSelectedCategoryId
  );
  const { t } = useTranslation();

  const handleDeletePresentation = async (presentationId: string) => {
    if (window.confirm(t("presentationsPage.deleteConfirm"))) {
      try {
        const response = await fetch(`/api/presentations/${presentationId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete presentation");
        }

        // Call the callback to refresh the presentation data on the parent component
        onPresentationDeleted();
      } catch (error) {
        console.error("Error deleting presentation:", error);
        alert(t("presentationsPage.deleteFailed"));
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

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {}
      <div className="lg:col-span-1">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">
            {t("presentationsPage.categoriesTitle")}
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`w-full text-left p-3 rounded-md transition-colors cursor-pointer ${
                  selectedCategoryId === category.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                ▶ {category.name} ({category.presentations.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="lg:col-span-3">
        <h2 className="text-3xl font-bold mb-6 text-white">
          {selectedCategory
            ? `${t("presentationsPage.headingWithCategory")} ${
                selectedCategory.name
              }`
            : t("presentationsPage.heading")}
        </h2>

        {selectedCategory && selectedCategory.presentations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {selectedCategory.presentations.map((presentation) => {
              const isAuthor =
                presentation.author?.email === session?.user?.email; // Need session here
              return (
                <div
                  key={presentation.id}
                  className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-green-500/30 transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <div
                    onClick={() =>
                      (window.location.href = `/presentations/${presentation.id}`)
                    }
                  >
                    <h3 className="text-xl font-semibold mb-3 text-green-400">
                      {presentation.title}
                    </h3>
                    <p
                      className="text-gray-300 mb-4 line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: presentation.description,
                      }}
                    />
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>
                        {t("presentationsPage.imagesLabel")}:{" "}
                        {presentation.imageUrls.length}
                      </span>
                      <span>
                        {t("presentationsPage.byLabel")}:{" "}
                        {presentation.author.name || presentation.author.email}
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
        ) : selectedCategory ? (
          <p className="text-gray-400 text-lg">
            {t("presentationsPage.noPresentationsInCategory")}
          </p>
        ) : (
          <p className="text-gray-400 text-lg">
            {t("presentationsPage.selectCategoryPrompt")}
          </p>
        )}
      </div>
    </div>
  );
};

export default PresentationsPage;

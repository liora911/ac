"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { PresentationCategory } from "@/types/Presentations/presentations";
import CreatePresentationForm from "@/components/CreatePresentation/create_presentation";
import { ALLOWED_EMAILS } from "@/constants/auth";

const PresentationsPage = () => {
  const { data: session } = useSession();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>("Banner Image");
  const [presentationCategoriesData, setPresentationCategoriesData] = useState<
    PresentationCategory[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAuthorized =
    session?.user?.email &&
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

  const handleBannerUpdate = (imageUrl: string | null, altText: string) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt(altText || "Banner Image");
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
      style={{ direction: "rtl" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">
            מצגות בנושאים שונים לפי קטגוריות
          </h1>
          {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold rtl"
            >
              {showCreateForm ? "ביטול" : "העלאת מצגת חדשה"}
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
              {isLoading ? "טוען באנר..." : "תמונה/באנר של המצגות יופיע כאן"}
            </p>
          )}
        </div>

        {isLoading && (
          <p className="text-center text-xl text-gray-300">טוען מצגות...</p>
        )}
        {error && (
          <p className="text-center text-xl text-red-500">
            שגיאה בטעינת מצגות: {error}
          </p>
        )}

        {!isLoading && !error && presentationCategoriesData && (
          <PresentationsGrid
            categories={presentationCategoriesData}
            onBannerUpdate={handleBannerUpdate}
          />
        )}

        {!isLoading &&
          !error &&
          (!presentationCategoriesData ||
            presentationCategoriesData.length === 0) && (
            <p className="text-center text-xl text-gray-400">לא נמצאו מצגות.</p>
          )}
      </div>
    </div>
  );
};

interface PresentationsGridProps {
  categories: PresentationCategory[];
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
}

const PresentationsGrid: React.FC<PresentationsGridProps> = ({
  categories,
  onBannerUpdate,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const handleCategoryClick = (category: PresentationCategory) => {
    setSelectedCategoryId(category.id);
    onBannerUpdate(category.bannerImageUrl, category.name);
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
            קטגוריות
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedCategoryId === category.id
                    ? "bg-blue-600 text-white"
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
          מצגות {selectedCategory ? `בקטגוריה: ${selectedCategory.name}` : ""}
        </h2>

        {selectedCategory && selectedCategory.presentations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {selectedCategory.presentations.map((presentation) => (
              <div
                key={presentation.id}
                className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 cursor-pointer"
                onClick={() =>
                  (window.location.href = `/presentations/${presentation.id}`)
                }
              >
                <h3 className="text-xl font-semibold mb-3 text-blue-400">
                  {presentation.title}
                </h3>
                <p
                  className="text-gray-300 mb-4 line-clamp-3 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: presentation.description }}
                />
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>תמונות: {presentation.imageUrls.length}</span>
                  <span>
                    מאת: {presentation.author.name || presentation.author.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory ? (
          <p className="text-gray-400 text-lg">אין מצגות זמינות בקטגוריה זו.</p>
        ) : (
          <p className="text-gray-400 text-lg">
            אנא בחר קטגוריה כדי להציג מצגות.
          </p>
        )}
      </div>
    </div>
  );
};

export default PresentationsPage;

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import CreateArticleForm from "@/components/CreateArticle/create_article";
import { ALLOWED_EMAILS } from "@/constants/auth";

interface Article {
  id: string;
  publisherImage: string;
  publisherName: string;
  date: string;
  readDuration: number;
  title: string;
  articleImage: string;
  content: string;
}

interface ArticleCategory {
  id: string;
  name: string;
  bannerImageUrl?: string;
  articles: Article[];
}

const ArticlesPage = () => {
  const { data: session } = useSession();
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [currentBannerAlt, setCurrentBannerAlt] =
    useState<string>("Banner Image");
  const [articleCategoriesData, setArticleCategoriesData] = useState<
    ArticleCategory[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  useEffect(() => {
    const fetchArticleData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/articles");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch articles: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: ArticleCategory[] = await response.json();
        setArticleCategoriesData(data);
      } catch (err: any) {
        console.error("Error fetching article data:", err);
        setError(err.message || "An unknown error occurred");
        setArticleCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleData();
  }, []);

  const handleBannerUpdate = (imageUrl: string | null, altText: string) => {
    setCurrentBannerUrl(imageUrl);
    setCurrentBannerAlt(altText || "Banner Image");
  };

  const handleArticleCreated = () => {
    // Refresh the article data
    const fetchArticleData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/articles");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch articles: ${response.statusText} (status: ${response.status})`
          );
        }
        const data: ArticleCategory[] = await response.json();
        setArticleCategoriesData(data);
      } catch (err: any) {
        console.error("Error fetching article data:", err);
        setError(err.message || "An unknown error occurred");
        setArticleCategoriesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleData();
    setShowCreateForm(false);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-gray-100 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: "rtl" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            מאמרים בנושאים שונים לפי קטגוריות
          </h1>
          {isAuthorized && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg transition-all duration-300 text-lg font-semibold rtl shadow-lg hover:shadow-cyan-500/25"
            >
              {showCreateForm ? "ביטול" : "העלאת מאמר חדש"}
            </button>
          )}
        </div>

        {showCreateForm && isAuthorized && (
          <div className="mb-8">
            <CreateArticleForm onSuccess={handleArticleCreated} />
          </div>
        )}

        <div className="mb-10 h-64 md:h-80 bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 rounded-xl shadow-2xl flex items-center justify-center border border-cyan-500/20 overflow-hidden backdrop-blur-sm relative">
          {currentBannerUrl ? (
            <>
              <Image
                src={currentBannerUrl}
                alt={currentBannerAlt}
                fill
                className="object-cover"
                priority
              />
              {/* Event details overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                <div className="p-4 md:p-6 text-white w-full">
                  <h3
                    className="text-xl md:text-2xl font-bold mb-1"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}
                  >
                    {currentBannerAlt}
                  </h3>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-xl">
              {isLoading ? "טוען באנר..." : "תמונה/באנר של המאמרים יופיע כאן"}
            </p>
          )}
        </div>

        {isLoading && (
          <p className="text-center text-xl text-cyan-300">טוען מאמרים...</p>
        )}
        {error && (
          <p className="text-center text-xl text-red-400">
            שגיאה בטעינת מאמרים: {error}
          </p>
        )}

        {!isLoading && !error && articleCategoriesData && (
          <ArticlesGrid
            categories={articleCategoriesData}
            onBannerUpdate={handleBannerUpdate}
          />
        )}

        {!isLoading &&
          !error &&
          (!articleCategoriesData || articleCategoriesData.length === 0) && (
            <p className="text-center text-xl text-cyan-300/70">
              לא נמצאו מאמרים.
            </p>
          )}
      </div>
    </div>
  );
};

interface ArticlesGridProps {
  categories: ArticleCategory[];
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
}

const ArticlesGrid: React.FC<ArticlesGridProps> = ({
  categories,
  onBannerUpdate,
}) => {
  const { data: session } = useSession();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const handleCategoryClick = (category: ArticleCategory) => {
    setSelectedCategoryId(category.id);
    onBannerUpdate(category.bannerImageUrl || null, category.name);
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the data
        window.location.reload();
      } else {
        alert("שגיאה במחיקת המאמר");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("שגיאה במחיקת המאמר");
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Categories Sidebar */}
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
                ▶ {category.name} ({category.articles.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="lg:col-span-3">
        <h2 className="text-3xl font-bold mb-6 text-white">
          מאמרים {selectedCategory ? `בקטגוריה: ${selectedCategory.name}` : ""}
        </h2>

        {selectedCategory && selectedCategory.articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {selectedCategory.articles.map((article) => (
              <div
                key={article.id}
                className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 cursor-pointer relative group"
                onClick={() =>
                  (window.location.href = `/article?id=${article.id}`)
                }
              >
                {isAuthorized && (
                  <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/edit-article/${article.id}`;
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                      title="ערוך מאמר"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("האם אתה בטוח שברצונך למחוק מאמר זה?")) {
                          handleDeleteArticle(article.id);
                        }
                      }}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                      title="מחק מאמר"
                    >
                      🗑️
                    </button>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-3 text-blue-400">
                  {article.title}
                </h3>
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {article.content.substring(0, 150)}...
                </p>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>קריאה: {article.readDuration} דקות</span>
                  <span>{article.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory ? (
          <p className="text-gray-400 text-lg">
            אין מאמרים זמינים בקטגוריה זו.
          </p>
        ) : (
          <p className="text-gray-400 text-lg">
            אנא בחר קטגוריה כדי להציג מאמרים.
          </p>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;

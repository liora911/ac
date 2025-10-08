"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ArticlesGrid from "@/components/Articles/Articles";
import CreateArticleForm from "@/components/CreateArticle/create_article";
import { ArticleProps } from "@/types/Articles/articles";
import { ALLOWED_EMAILS } from "@/constants/auth";

export default function ArticlesDemoPage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<ArticleProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/articles");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setArticles(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleArticleCreated = () => {
    fetchArticles();
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מאמרים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchArticles()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold rtl">מאמרים</h1>
        {isAuthorized && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors rtl"
          >
            {showCreateForm ? "ביטול" : "+ מאמר חדש"}
          </button>
        )}
      </div>

      {showCreateForm && isAuthorized && (
        <div className="mb-8">
          <CreateArticleForm onSuccess={handleArticleCreated} />
        </div>
      )}

      {articles.length === 0 ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg rtl">אין מאמרים זמינים כרגע</p>
            <p className="text-sm text-gray-500 mt-2 rtl">
              צור מאמר חדש או הרץ: node scripts/seed.js
            </p>
          </div>
        </div>
      ) : (
        <ArticlesGrid articles={articles} />
      )}
    </div>
  );
}

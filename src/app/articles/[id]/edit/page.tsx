"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import ArticleForm from "@/components/Articles/ArticleForm";
import { useArticle } from "@/hooks/useArticles";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const { t } = useTranslation();

  const { data: article, isLoading, error } = useArticle(articleId);

  const handleSuccess = () => {
    router.push("/articles");
  };

  const handleCancel = () => {
    router.push("/articles");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingArticleData")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            {t("articleForm.errorLoading")}
          </div>
          <p className="text-gray-600 mb-4">
            {error.message || t("articleForm.articleNotFoundMessage")}
          </p>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("articleForm.backToArticles")}
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-semibold mb-2">
            {t("articleForm.articleNotFound")}
          </div>
          <p className="text-gray-600 mb-4">
            {t("articleForm.articleNotFoundMessage")}
          </p>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("articleForm.backToArticles")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("articleForm.editArticleTitle")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("articleForm.editArticleDescription")}
          </p>
        </div>

        <ArticleForm
          article={article}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

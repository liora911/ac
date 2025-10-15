"use client";

import React from "react";
import Link from "next/link";
import ArticlesList from "@/components/Articles/ArticlesList";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function ArticlesPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("articlesPage.title")}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("articlesPage.description")}
            </p>
            <div className="mt-6">
              <Link href="/articles/create" passHref>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                  {t("articlesPage.createArticleButton")}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticlesList
          initialLimit={12}
          showFilters={true}
          showPagination={true}
        />
      </div>
    </div>
  );
}

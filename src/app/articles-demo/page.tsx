"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ArticlesList from "@/components/Articles/ArticlesList";
import ArticleForm from "@/components/Articles/ArticleForm";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function ArticlesDemoPage() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const handleArticleCreated = () => {
    setShowCreateForm(false);
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("articlesPage.title")}
              </h1>
              <p className="text-gray-600 mt-2">{t("articlesPage.title")}</p>
            </div>
            {isAuthorized && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer"
              >
                {showCreateForm
                  ? t("articleForm.cancelButton")
                  : `+ ${t("articleForm.createArticleButton")}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {}
      {showCreateForm && isAuthorized && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ArticleForm
            onSuccess={handleArticleCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticlesList
          initialLimit={9}
          showFilters={true}
          showPagination={true}
        />
      </div>
    </div>
  );
}

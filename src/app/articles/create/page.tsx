"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ArticleForm from "@/components/Articles/ArticleForm";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function CreateArticlePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const handleSuccess = () => {
    router.push("/articles");
  };

  const handleCancel = () => {
    router.push("/articles");
  };

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            {t("articleForm.unauthorizedTitle")}
          </h2>
          <p className="text-gray-600">
            {t("articleForm.unauthorizedMessage")}
          </p>
          <p className="text-sm text-gray-500 mt-2">{session?.user?.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("articleForm.createNewArticleTitle")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("articlesPage.createArticleDescription")}
          </p>
        </div>

        <ArticleForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}

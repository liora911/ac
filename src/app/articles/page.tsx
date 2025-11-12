"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";

// Lazy load the heavy ArticlesList component
const ArticlesList = dynamic(
  () => import("@/components/Articles/ArticlesList"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

export default function ArticlesPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50 bg-cover bg-center">
      {}
      <div className="shadow-sm">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[300px]"
          style={{
            backgroundImage: "url('/bookwrite.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("articlesPage.title")}
            </h1>
            <p
              className="text-xl text-white max-w-3xl mx-auto"
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
            >
              {t("articlesPage.description")}
            </p>
            {/* {isAuthorized && (
              <div className="mt-6">
                <Link href="/articles/create" passHref>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                    {t("articlesPage.createArticleButton")}
                  </button>
                </Link>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <ArticlesList
            initialLimit={12}
            showFilters={true}
            showPagination={true}
            viewMode="grid"
          />
        </Suspense>
      </div>
    </div>
  );
}

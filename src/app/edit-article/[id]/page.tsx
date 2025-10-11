"use client";

import React from "react";
import EditArticleForm from "@/components/EditArticle/edit_article";

export default function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const { id: articleId } = params;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          עריכת מאמר
        </h1>
        <EditArticleForm articleId={articleId} />
      </div>
    </div>
  );
}

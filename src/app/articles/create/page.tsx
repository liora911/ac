"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ArticleForm from "@/components/Articles/ArticleForm";

export default function CreateArticlePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/articles");
  };

  const handleCancel = () => {
    router.push("/articles");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Article
          </h1>
          <p className="text-gray-600 mt-2">
            Share your knowledge and insights with the community.
          </p>
        </div>

        <ArticleForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}

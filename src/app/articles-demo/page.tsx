"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ArticlesList from "@/components/Articles/ArticlesList";
import ArticleForm from "@/components/Articles/ArticleForm";
import { ALLOWED_EMAILS } from "@/constants/auth";

export default function ArticlesDemoPage() {
  const { data: session } = useSession();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const handleArticleCreated = () => {
    setShowCreateForm(false);
    // The ArticlesList component will automatically refetch data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">כל המאמרים</h1>
              <p className="text-gray-600 mt-2">מאמרים</p>
            </div>
            {isAuthorized && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                {showCreateForm ? "Cancel" : "+ Create Article"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && isAuthorized && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ArticleForm
            onSuccess={handleArticleCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Articles List */}
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

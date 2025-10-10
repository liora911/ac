"use client";

import React from "react";
import ArticlesList from "@/components/Articles/ArticlesList";

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Articles</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our collection of articles covering various topics in
              physics, philosophy, and scientific research.
            </p>
          </div>
        </div>
      </div>

      {/* Articles List */}
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

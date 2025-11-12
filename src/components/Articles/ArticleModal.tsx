"use client";

import React from "react";
import Image from "next/image";
import { Article } from "@/types/Articles/articles";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  if (!article) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      dateLocale as Intl.LocalesArgument,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer transition-colors z-10"
        >
          &times;
        </button>

        <div className="p-6">
          <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {article.author.image && (
                  <Image
                    src={article.author.image}
                    alt={article.author.name || "Author"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {article.author.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(article.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {article.readTime} min read
                </span>
                {article.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {article.category.name}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          {article.featuredImage && (
            <div className="mb-6">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-800 leading-relaxed mb-6"
            dir={article.direction || (locale === "en" ? "ltr" : "rtl")}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <footer className="border-t border-gray-200 pt-6">
            {article.tags && article.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {article.author.image && (
                  <Image
                    src={article.author.image}
                    alt={article.author.name || "Author"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {article.author.name || "Anonymous"}
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;

"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useArticle } from "@/hooks/useArticles";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const articleId = params.id as string;

  const { data: article, isLoading, error } = useArticle(articleId);
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Error loading article
          </div>
          <p className="text-gray-600 mb-4">
            {error.message || "The article could not be found."}
          </p>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Articles
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
            Article not found
          </div>
          <p className="text-gray-600 mb-4">
            The article you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/articles")}
              className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
            >
              ← Back to Articles
            </button>

            {isAuthorized && (
              <Link
                href={`/articles/${article.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Article
              </Link>
            )}
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <header className="mb-8">
          {}
          {isAuthorized && (
            <div className="mb-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  article.status
                )}`}
              >
                {article.status}
              </span>
              {article.isFeatured && (
                <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Featured
                </span>
              )}
            </div>
          )}

          {}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {}
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {}
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div className="flex items-center space-x-4">
              {}
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
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                {article.readTime} min read
              </p>
              {article.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {article.category.name}
                </span>
              )}
            </div>
          </div>
        </header>

        {}
        {article.featuredImage && (
          <div className="mb-8">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {}
        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          {}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-6">
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

          {}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              {article.author.image && (
                <Image
                  src={article.author.image}
                  alt={article.author.name || "Author"}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {article.author.name || "Anonymous"}
                </h3>
                <p className="text-gray-600 mt-1">
                  Author of this article. Passionate about sharing knowledge and
                  insights.
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.push("/articles")}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to Articles
            </button>

            {isAuthorized && (
              <Link
                href={`/articles/${article.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Article
              </Link>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useArticle } from "@/hooks/useArticles";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import AuthorAvatars from "@/components/Articles/AuthorAvatars";
import RichContent from "@/components/RichContent";
import PremiumGate from "@/components/PremiumGate/PremiumGate";
import { Sparkles, Pencil } from "lucide-react";
import { track } from "@vercel/analytics";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const articleId = params.id as string;
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const { data: article, isLoading, error } = useArticle(articleId);
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  // Track article view
  useEffect(() => {
    if (article) {
      track("article_viewed", {
        articleId: article.id,
        title: article.title,
        isPremium: article.isPremium ?? false,
        category: article.category?.name || "uncategorized",
      });
    }
  }, [article]);

  const downloadPDF = () => {
    if (!article) return;

    // Track PDF download
    track("article_pdf_downloaded", {
      articleId: article.id,
      title: article.title,
    });

    // Strip HTML tags safely using DOMParser (doesn't execute scripts)
    const stripHtml = (html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return doc.body.textContent || "";
    };

    const authors = article.authors?.map(a => a.name).join(", ") || article.publisherName || "Unknown";
    const date = new Date(article.createdAt).toLocaleDateString(dateLocale);
    const content = stripHtml(article.content);
    const isRTL = locale === "he";

    // Create a new window with printable content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download PDF");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? "rtl" : "ltr"}" lang="${locale}">
      <head>
        <meta charset="UTF-8">
        <title>${article.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=David+Libre:wght@400;700&family=Noto+Sans+Hebrew:wght@400;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Noto Sans Hebrew', 'David Libre', 'Arial Hebrew', Arial, sans-serif;
            line-height: 1.8;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #1a1a1a;
            direction: ${isRTL ? "rtl" : "ltr"};
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }

          h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #111;
          }

          .meta {
            font-size: 14px;
            color: #666;
          }

          .content {
            font-size: 16px;
            text-align: justify;
            white-space: pre-wrap;
          }

          .content p {
            margin-bottom: 16px;
          }

          @media print {
            body {
              padding: 20px;
            }

            @page {
              margin: 2cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${article.title}</h1>
          <p class="meta">${authors} | ${date}</p>
        </div>
        <div class="content">${content}</div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("articleDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg font-semibold mb-2">
            {t("articleDetail.errorTitle")}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || t("articleDetail.errorGeneric")}
          </p>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("articleDetail.backToArticles")}
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-2">
            {t("articleDetail.notFoundTitle")}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t("articleDetail.notFoundMessage")}
          </p>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {t("articleDetail.backToArticles")}
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {}
      <div className="bg-white dark:bg-gray-800 shadow-sm"></div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Edit Button - Fixed position */}
        {isAuthorized && (
          <Link
            href={`/articles/${article.id}/edit`}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
            title={t("articleDetail.editButton")}
          >
            <Pencil className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">{t("articleDetail.editButton")}</span>
          </Link>
        )}

        {}
        <header className="mb-8">
          {}
          <div className="mb-4 flex flex-wrap gap-2">
            {article.isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                <Sparkles className="w-3 h-3" />
                {t("articleCard.premium") || "Premium"}
              </span>
            )}
            {isAuthorized && (
              <>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    article.status
                  )}`}
                >
                  {article.status}
                </span>
                {article.isFeatured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                    {t("articleCard.featured")}
                  </span>
                )}
              </>
            )}
          </div>

          {}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {article.title}
          </h1>

          {}
          {article.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center space-x-4">
              {}
              <div className="flex items-center gap-3">
                {article.authors && article.authors.length > 0 ? (
                  <>
                    <AuthorAvatars authors={article.authors} size="lg" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {article.authors.length === 1
                          ? article.authors[0].name
                          : article.authors.length === 2
                          ? `${article.authors[0].name} ו${article.authors[1].name}`
                          : `${article.authors[0].name} ועוד ${article.authors.length - 1}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(article.createdAt)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {article.author?.image && (
                      <Image
                        src={article.author.image}
                        alt={article.author.name || "Author"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {article.publisherName || t("articleCard.authorAnonymous")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(article.createdAt)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {article.readTime} {t("articleCard.minRead")}
              </p>
              {article.categories && article.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {article.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              ) : article.category ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 mt-1">
                  {article.category.name}
                </span>
              ) : null}
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

        {/* Article Content */}
        <PremiumGate
          isPremium={article.isPremium}
          previewContent={
            <div dir={article.direction || (locale === "en" ? "ltr" : "rtl")}>
              <RichContent
                content={article.content.slice(0, 500) + "..."}
                className="text-gray-800 dark:text-gray-200"
              />
            </div>
          }
        >
          <div dir={article.direction || (locale === "en" ? "ltr" : "rtl")}>
            <RichContent content={article.content} className="text-gray-800 dark:text-gray-200" />
          </div>
        </PremiumGate>

        {}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          {}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t("articleDetail.tagsTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              {article.authors && article.authors.length > 0 ? (
                <>
                  <AuthorAvatars authors={article.authors} size="lg" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.authors.map(a => a.name).join(", ")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {t("articleDetail.copyleftNote")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {article.author?.image && (
                    <Image
                      src={article.author.image}
                      alt={article.author.name || "Author"}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.author?.name ||
                        article.publisherName ||
                        t("articleCard.authorAnonymous")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {t("articleDetail.copyleftNote")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.push("/articles")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
            >
              ← {t("articleDetail.backToArticles")}
            </button>

            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                📄 הורד PDF
              </button>
              {/* {isAuthorized && (
                <Link
                  href={`/articles/${article.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {t("articleDetail.editButton")}
                </Link>
              )} */}
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

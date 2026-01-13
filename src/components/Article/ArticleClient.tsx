"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface ArticleClientProps {
  articleId: string;
  articleTitle: string;
  isPremium: boolean;
  categoryName?: string;
  isAuthorized: boolean;
  locale: string;
  dateLocale: string;
  createdAt: string;
  publisherName?: string;
  translations: {
    editButton: string;
    backToArticles: string;
  };
}

export default function ArticleClient({
  articleId,
  articleTitle,
  isPremium,
  categoryName,
  isAuthorized,
  locale,
  dateLocale,
  createdAt,
  publisherName,
  translations,
}: ArticleClientProps) {
  const router = useRouter();

  // Track article view
  useEffect(() => {
    track("article_viewed", {
      articleId,
      title: articleTitle,
      isPremium,
      category: categoryName || "uncategorized",
    });
  }, [articleId, articleTitle, isPremium, categoryName]);

  const downloadPDF = () => {
    // Track PDF download
    track("article_pdf_downloaded", {
      articleId,
      title: articleTitle,
    });

    // Get the article content
    const contentElement = document.querySelector(".article-content");
    if (!contentElement) return;

    // Strip HTML tags safely using DOMParser (doesn't execute scripts)
    const stripHtml = (html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return doc.body.textContent || "";
    };

    const content = stripHtml(contentElement.innerHTML);
    const date = new Date(createdAt).toLocaleDateString(dateLocale);
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
        <title>${articleTitle}</title>
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
          <h1>${articleTitle}</h1>
          <p class="meta">${publisherName || "Unknown"} | ${date}</p>
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

  return (
    <>
      {/* Admin Edit Button - Fixed position */}
      {isAuthorized && (
        <Link
          href={`/articles/${articleId}/edit`}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title={translations.editButton}
        >
          <Pencil className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">
            {translations.editButton}
          </span>
        </Link>
      )}

      {/* Footer Actions */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => router.push("/articles")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
        >
          ← {translations.backToArticles}
        </button>

        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            📄 הורד PDF
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { Download } from "lucide-react";
import { track } from "@vercel/analytics";
import type { DownloadPDFButtonProps } from "@/types/Articles/articles";

export default function DownloadPDFButton({
  articleId,
  articleTitle,
  locale,
  dateLocale,
  createdAt,
  publisherName,
  downloadText,
}: DownloadPDFButtonProps) {
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
    <button
      onClick={downloadPDF}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
    >
      <Download className="w-4 h-4" />
      <span>{downloadText}</span>
    </button>
  );
}

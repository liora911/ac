"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DOMPurify from "dompurify";
import type { ArticleViewData } from "@/types/Articles/articles";
import { formatDate } from "@/lib/utils/date";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function ArticlePage() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");
  const { t, locale } = useTranslation();

  const [article, setArticle] = useState<ArticleViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const downloadPDF = async () => {
    const element = document.querySelector(".article-content") as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${article?.title || "article"}.pdf`);
    } catch (error) {}
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError(t("articleView.missingId"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/articles/${articleId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const foundArticle: ArticleViewData = await response.json();
        setArticle(foundArticle);
      } catch (err) {
        setError(t("articleView.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("articleView.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 text-center text-gray-600 dark:text-gray-400">
        <p className="text-lg mb-4">{error || t("articleView.notFound")}</p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
        >
          {t("articleView.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="relative w-full h-[80vh]">
        <Image
          src={article.articleImage}
          alt={article.title}
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-center items-start px-8 sm:px-16 md:px-24 text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight max-w-5xl drop-shadow-md">
            {article.title}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-200 font-light">
            {t("articleView.by")} {article.publisherName} · {formatDate(article.createdAt, locale)}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-12 py-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {article.publisherImage && (
              <Image
                src={article.publisherImage}
                alt={article.publisherName}
                width={40}
                height={40}
                className="rounded-full border"
              />
            )}
            <div>
              <p className="font-semibold">{article.publisherName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(article.createdAt, locale)} · {article.readDuration} {t("articleView.readMinutes")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {t("articleView.downloadPdf")}
            </button>
          </div>
        </div>

        <div
          className="text-lg leading-loose text-gray-800 dark:text-gray-200 prose prose-lg dark:prose-invert max-w-none article-content"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(article.content, {
              ADD_ATTR: ['style'],
            }),
          }}
        />
      </div>
    </div>
  );
}

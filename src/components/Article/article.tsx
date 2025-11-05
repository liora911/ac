"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Article {
  id: string;
  publisherImage: string;
  publisherName: string;
  date: string;
  readDuration: number;
  title: string;
  articleImage: string;
  content: string;
  author?: {
    email: string;
  };
}

export default function ArticlePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get("id");

  const [article, setArticle] = useState<Article | null>(null);
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
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError("מזהה מאמר חסר");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/articles/${articleId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const foundArticle: Article = await response.json();
        setArticle(foundArticle);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("שגיאה בטעינת המאמר");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מאמר...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p className="text-lg mb-4">{error || "המאמר לא נמצא"}</p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
        >
          חזור
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-gray-900">
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
            מאת {article.publisherName} · {article.date}
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
              <p className="text-sm text-gray-600">
                {article.date} · {article.readDuration} דקות קריאה
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              📄 הורד PDF
            </button>
            {
              <button
                onClick={() => router.push(`/edit-article/${articleId}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                ✏️ ערוך מאמר
              </button>
            }
          </div>
        </div>

        <div
          className="text-lg leading-loose text-gray-800 prose prose-lg max-w-none article-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";
import RichContent from "@/components/RichContent";

interface AboutPageData {
  id: string;
  titleEn: string;
  titleHe: string;
  contentEn: string | null;
  contentHe: string | null;
  imageUrl: string | null;
  published: boolean;
  updatedAt: string;
}

export default function AboutPage() {
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";

  const [aboutData, setAboutData] = useState<AboutPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAboutPage = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/about");
        if (!res.ok) {
          throw new Error("Failed to fetch about page");
        }
        const data = await res.json();
        setAboutData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAboutPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!aboutData || !aboutData.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t("about.notAvailable")}
          </p>
        </div>
      </div>
    );
  }

  const title = isHebrew ? aboutData.titleHe : aboutData.titleEn;
  const content = isHebrew ? aboutData.contentHe : aboutData.contentEn;

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8"
      dir={isHebrew ? "rtl" : "ltr"}
    >
      <article className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {title}
        </h1>

        {/* Featured Image */}
        {aboutData.imageUrl && (
          <div className="relative w-full aspect-video mb-10 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={aboutData.imageUrl}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        {content && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 sm:p-12">
            <RichContent
              content={content}
              className="prose prose-lg dark:prose-invert max-w-none"
            />
          </div>
        )}
      </article>
    </div>
  );
}

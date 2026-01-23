"use client";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useHomeContent } from "@/hooks/useHomeContent";
import { useHomePreview } from "@/hooks/useHomePreview";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Image from "next/image";
import React, { useState, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import CarouselSection from "./CarouselSection";
import FeaturedCarouselSection from "./FeaturedCarouselSection";
import RichContent from "@/components/RichContent";
import type { ContentItem } from "@/types/Home/home";
import { getYouTubeThumbnailFromUrl } from "@/lib/utils/youtube";

const FETCH_BATCH_SIZE = 9; // v2 - two-column hero

const FaFacebook = dynamic(
  () => import("react-icons/fa").then((mod) => ({ default: mod.FaFacebook })),
  {
    loading: () => (
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ),
  }
);
const FaYoutube = dynamic(
  () => import("react-icons/fa").then((mod) => ({ default: mod.FaYoutube })),
  {
    loading: () => (
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ),
  }
);

const Home = () => {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const [showBio, setShowBio] = useState(false);
  const { data: homeContent } = useHomeContent();
  const { data: previewData, isLoading: previewLoading } = useHomePreview();
  const { data: siteSettings } = useSiteSettings();

  // Load more items for carousel pagination
  const handleLoadMore = useCallback(async (type: string, skip: number): Promise<{ items: ContentItem[]; hasMore: boolean }> => {
    try {
      const response = await fetch(`/api/home-preview?type=${type}&skip=${skip}&limit=${FETCH_BATCH_SIZE}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      return {
        items: data.items || [],
        hasMore: data.hasMore ?? false,
      };
    } catch (error) {
      console.error("Failed to load more items:", error);
      return { items: [], hasMore: false };
    }
  }, []);

  const photoCreditText = homeContent?.photoCredit || t("home.photoCredit");
  const bioHtml = homeContent?.bioHtml || "";
  const hasDynamicBio = bioHtml.trim().length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Helper functions to get image URLs for each content type
  const getArticleImage = useCallback((item: ContentItem) => {
    return item.articleImage || null;
  }, []);

  const getLectureImage = useCallback((item: ContentItem) => {
    return item.bannerImageUrl || getYouTubeThumbnailFromUrl(item.videoUrl);
  }, []);

  const getEventImage = useCallback((item: ContentItem) => {
    return item.bannerImageUrl || null;
  }, []);

  const getPresentationImage = useCallback((item: ContentItem) => {
    return item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;
  }, []);

  // Helper functions to get subtitles
  const getArticleSubtitle = useCallback((item: ContentItem) => {
    return item.subtitle || null;
  }, []);

  const getDescriptionSubtitle = useCallback((item: ContentItem) => {
    return item.description || null;
  }, []);

  return (
    <main className="flex flex-col min-h-screen text-[var(--foreground)]">
      {/* Hero Section */}
      <motion.section
        className="relative py-16 md:py-20 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
            {/* Profile Image */}
            <motion.div className="shrink-0" variants={itemVariants}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full blur-sm" />
                <Image
                  src="/acpfp2.png"
                  alt="Avshalom C. Elitzur"
                  width={180}
                  height={180}
                  className="relative rounded-full shadow-2xl"
                  priority
                  sizes="180px"
                  quality={85}
                />
              </div>
              <p className="text-xs text-center mt-3 text-slate-500 dark:text-slate-400">
                {photoCreditText}
              </p>
            </motion.div>

            {/* Name and Info */}
            <div className="flex-1 text-center md:text-start">
              {/* Two-column bilingual layout */}
              {(homeContent?.heroHtmlLeft || homeContent?.heroHtmlRight) ? (
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10"
                >
                  {/* Left Column - English/LTR */}
                  {homeContent?.heroHtmlLeft && (
                    <div
                      dir="ltr"
                      className="prose prose-slate dark:prose-invert max-w-none text-left
                        prose-headings:text-slate-900 dark:prose-headings:text-white
                        prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:font-bold prose-h1:tracking-tight
                        prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                        [&>*:first-child]:mt-0"
                    >
                      <RichContent content={homeContent.heroHtmlLeft} />
                    </div>
                  )}
                  {/* Right Column - Hebrew/RTL */}
                  {homeContent?.heroHtmlRight && (
                    <div
                      dir="rtl"
                      className="prose prose-slate dark:prose-invert max-w-none text-right
                        prose-headings:text-slate-900 dark:prose-headings:text-white
                        prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:font-bold prose-h1:tracking-tight
                        prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                        [&>*:first-child]:mt-0"
                    >
                      <RichContent content={homeContent.heroHtmlRight} />
                    </div>
                  )}
                </motion.div>
              ) : homeContent?.heroHtml ? (
                <motion.div
                  variants={itemVariants}
                  className="prose prose-slate dark:prose-invert max-w-none
                    prose-headings:text-slate-900 dark:prose-headings:text-white
                    prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:lg:text-5xl prose-h1:font-bold prose-h1:tracking-tight
                    prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                    [&>*:first-child]:mt-0"
                >
                  <RichContent content={homeContent.heroHtml} />
                </motion.div>
              ) : (
                <>
                  <motion.h1
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight"
                    variants={itemVariants}
                  >
                    {t("home.name")}
                  </motion.h1>
                  <motion.p
                    className="text-lg md:text-xl mt-3 text-slate-500 dark:text-slate-400"
                    variants={itemVariants}
                  >
                    {t("home.tagline")}
                  </motion.p>

                  <motion.p
                    className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed"
                    variants={itemVariants}
                  >
                    {t("home.greeting")}
                  </motion.p>
                </>
              )}

              {/* Social Links */}
              {(siteSettings?.facebookUrl || siteSettings?.youtubeUrl) && (
                <motion.div
                  className="flex justify-center md:justify-start gap-3 mt-6"
                  variants={itemVariants}
                >
                  {siteSettings?.facebookUrl && (
                    <Suspense
                      fallback={
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                      }
                    >
                      <a
                        href={siteSettings.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors"
                        aria-label={t("home.social.facebook")}
                      >
                        <FaFacebook size={18} />
                      </a>
                    </Suspense>
                  )}
                  {siteSettings?.youtubeUrl && (
                    <Suspense
                      fallback={
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                      }
                    >
                      <a
                        href={siteSettings.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors"
                        aria-label={t("home.social.youtube")}
                      >
                        <FaYoutube size={18} />
                      </a>
                    </Suspense>
                  )}
                </motion.div>
              )}

              {/* Bio Toggle */}
              <motion.div className="mt-6" variants={itemVariants}>
                <button
                  onClick={() => setShowBio(!showBio)}
                  className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-medium transition-colors"
                >
                  {showBio ? (
                    <>
                      {t("home.bio.buttonHide")}
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      {t("home.bio.buttonRead")}
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* Bio Section - Expanded */}
          <AnimatePresence>
            {showBio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <div
                    className="text-slate-600 dark:text-slate-300 leading-relaxed"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {hasDynamicBio ? (
                      <RichContent content={bioHtml} />
                    ) : (
                      <div className="space-y-4" dir="rtl">
                        <p>
                          אבשלום אליצור הוא פרופסור-נלווה במכון למחקרים קוונטיים באוניברסיטת צ&apos;פמאן בקליפורניה, בראשות פרופ&apos; יקיר אהרונוב, לצד חתני פרס נובל פול אנגלרט ודייוויד גרוס.
                        </p>
                        <p>
                          תחומי התמחותו הם תורת הקוונטים, יחסות ותרמודינמיקה, וכן תרמודינמיקה של מערכות חיות. בין תגליותיו נמנים ניסוי אליצור-ויידמן (1993), בשמו הידוע יותר &quot;ניסוי הפצצה-שלא-התפוצצה&quot;.
                        </p>
                        <p>
                          את עבודותיו הציג במפגשים המדעיים היוקרתיים בעולם, כולל הרצאות מליאה והרצאות keynote לצד חתני-פרס נובל, בין השאר באוניברסיטאות קיימברידג&apos; ופרינסטון, במכון שרדינגר בווינה וב-ETH בציריך.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Content Preview Section */}
      <section className="py-8 md:py-12 px-6 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-start mb-8 text-[var(--foreground)]">
            {t("home.sections.exploreContent")}
          </h2>

          {previewLoading ? (
            <div className="space-y-10">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className="aspect-[16/10] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {/* Featured Articles */}
              {previewData?.featuredArticles && previewData.featuredArticles.length > 0 && (
                <FeaturedCarouselSection
                  title={t("home.sections.featuredArticles")}
                  items={previewData.featuredArticles}
                  href="/articles?featured=true"
                  linkPrefix="/articles"
                  useSlug={true}
                  contentType="featuredArticles"
                  onLoadMore={handleLoadMore}
                  getImageUrl={getArticleImage}
                  getSubtitle={getArticleSubtitle}
                />
              )}

              {/* Recent Articles */}
              <CarouselSection
                title={t("home.sections.recentArticles")}
                items={previewData?.articles || []}
                href="/articles"
                linkPrefix="/articles"
                useSlug={true}
                contentType="articles"
                onLoadMore={handleLoadMore}
                getImageUrl={getArticleImage}
                getSubtitle={getArticleSubtitle}
              />

              {/* Lectures */}
              <CarouselSection
                title={t("home.sections.latestLectures")}
                items={previewData?.lectures || []}
                href="/lectures"
                linkPrefix="/lectures"
                contentType="lectures"
                onLoadMore={handleLoadMore}
                getImageUrl={getLectureImage}
                getSubtitle={getDescriptionSubtitle}
              />

              {/* Presentations */}
              <CarouselSection
                title={t("home.sections.presentations")}
                items={previewData?.presentations || []}
                href="/presentations"
                linkPrefix="/presentations"
                contentType="presentations"
                onLoadMore={handleLoadMore}
                getImageUrl={getPresentationImage}
                getSubtitle={getDescriptionSubtitle}
              />

              {/* Featured Events */}
              {previewData?.featuredEvents && previewData.featuredEvents.length > 0 && (
                <CarouselSection
                  title={t("home.sections.featuredEvents")}
                  items={previewData.featuredEvents}
                  href="/events?featured=true"
                  linkPrefix="/events"
                  contentType="featuredEvents"
                  onLoadMore={handleLoadMore}
                  getImageUrl={getEventImage}
                  getSubtitle={getDescriptionSubtitle}
                />
              )}

              {/* Events */}
              <CarouselSection
                title={t("home.sections.upcomingEvents")}
                items={previewData?.events || []}
                href="/events"
                linkPrefix="/events"
                contentType="events"
                onLoadMore={handleLoadMore}
                getImageUrl={getEventImage}
                getSubtitle={getDescriptionSubtitle}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;

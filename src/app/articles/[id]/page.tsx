import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import AuthorAvatars from "@/components/Articles/AuthorAvatars";
import RichContent from "@/components/RichContent";
import PremiumGate from "@/components/PremiumGate/PremiumGate";
import ArticleClient from "@/components/Article/ArticleClient";
import DownloadPDFButton from "@/components/Article/DownloadPDFButton";
import en from "@/locales/en.json";
import he from "@/locales/he.json";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

// Server-side function to fetch article by ID or slug
async function getArticle(idOrSlug: string) {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  // Decode URL parameter (handles percent-encoded slugs like %D7%99...)
  const decodedIdOrSlug = decodeURIComponent(idOrSlug);

  // Try to find by slug first (more SEO-friendly)
  let article = await prisma.article.findUnique({
    where: { slug: decodedIdOrSlug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          bannerImageUrl: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              bannerImageUrl: true,
            },
          },
        },
      },
      authors: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          order: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
    },
  });

  // If not found by slug, try by ID (backward compatibility)
  if (!article) {
    article = await prisma.article.findUnique({
      where: { id: decodedIdOrSlug },
      include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          bannerImageUrl: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              bannerImageUrl: true,
            },
          },
        },
      },
      authors: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          order: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
    },
    });
  }

  return article;
}

// Fetch related articles that share tags with the current article
async function getRelatedArticles(articleId: string, tagIds: string[], limit: number = 3) {
  if (!prisma || tagIds.length === 0) {
    return [];
  }

  const relatedArticles = await prisma.article.findMany({
    where: {
      published: true,
      id: { not: articleId },
      tags: { some: { tagId: { in: tagIds } } },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      articleImage: true,
      readDuration: true,
      createdAt: true,
      publisherName: true,
      authors: {
        orderBy: { order: "asc" },
        take: 1,
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return relatedArticles;
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article || !article.published) {
    return {
      title: "Article Not Found",
    };
  }

  // Strip HTML tags from content for description using simple regex
  const cleanContent = article.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const excerpt = cleanContent.slice(0, 160).trim() + (cleanContent.length > 160 ? "..." : "");

  const authorNames = article.authors && article.authors.length > 0
    ? article.authors.map((a) => a.name)
    : [article.publisherName || "Unknown"];

  return {
    title: article.title,
    description: excerpt,
    openGraph: {
      title: article.title,
      description: excerpt,
      type: "article",
      publishedTime: article.createdAt.toISOString(),
      authors: authorNames,
      images: article.articleImage
        ? [
            {
              url: article.articleImage,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: excerpt,
      images: article.articleImage ? [article.articleImage] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);
  const session = await getServerSession(authOptions);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  // Only show published articles to public
  if (!article || (!article.published && !isAuthorized)) {
    notFound();
  }

  // Fetch related articles based on shared tags
  const tagIds = article.tags?.map((at) => at.tag.id) || [];
  const relatedArticles = await getRelatedArticles(article.id, tagIds, 3);

  // Determine locale (you might want to get this from headers or context)
  const locale = article.direction === "rtl" ? "he" : "en";
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const formatDate = (dateString: Date) => {
    return dateString.toLocaleDateString(dateLocale as Intl.LocalesArgument, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (published: boolean) => {
    return published
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  // Get translations from locale files
  const translations = locale === "he" ? he : en;
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm"></div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticleClient
          articleId={article.id}
          articleTitle={article.title}
          isPremium={article.isPremium}
          categoryName={article.category?.name}
          isAuthorized={!!isAuthorized}
          locale={locale}
          dateLocale={dateLocale}
          createdAt={article.createdAt.toISOString()}
          publisherName={
            article.authors && article.authors.length > 0
              ? article.authors.map((a) => a.name).join(", ")
              : article.publisherName || undefined
          }
          translations={{
            editButton: t("articleDetail.editButton"),
            downloadPDF: t("articleDetail.downloadPDF"),
          }}
        />

        <header className="mb-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {article.isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                <Sparkles className="w-3 h-3" />
                {t("articleCard.premium")}
              </span>
            )}
            {isAuthorized && (
              <>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    article.published
                  )}`}
                >
                  {article.published
                    ? t("admin.common.published")
                    : t("admin.common.draft")}
                </span>
              </>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center space-x-4">
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
                          : `${article.authors[0].name} ועוד ${
                              article.authors.length - 1
                            }`}
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
                {article.readDuration} {t("articleCard.minRead")}
              </p>
              {article.categories && article.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {article.categories.map((cat) => (
                    <span
                      key={cat.category.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                    >
                      {cat.category.name}
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

        {/* Article Content */}
        <PremiumGate
          isPremium={article.isPremium}
          previewContent={
            <div
              dir={article.direction || (locale === "en" ? "ltr" : "rtl")}
              className="article-content"
            >
              <RichContent
                content={article.content.slice(0, 500) + "..."}
                className="text-gray-800 dark:text-gray-200"
              />
            </div>
          }
        >
          <div
            dir={article.direction || (locale === "en" ? "ltr" : "rtl")}
            className="article-content"
          >
            <RichContent
              content={article.content}
              className="text-gray-800 dark:text-gray-200"
            />
          </div>
        </PremiumGate>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              {article.authors && article.authors.length > 0 ? (
                <>
                  <AuthorAvatars authors={article.authors} size="lg" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.authors.map((a) => a.name).join(", ")}
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

          {/* PDF Download Button */}
          <div className="flex justify-end">
            <DownloadPDFButton
              articleId={article.id}
              articleTitle={article.title}
              locale={locale}
              dateLocale={dateLocale}
              createdAt={article.createdAt.toISOString()}
              publisherName={
                article.authors && article.authors.length > 0
                  ? article.authors.map((a) => a.name).join(", ")
                  : article.publisherName || undefined
              }
              downloadText={t("articleDetail.downloadPDF")}
            />
          </div>
        </footer>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t("articleDetail.relatedArticles")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.slug || related.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {related.articleImage && (
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={related.articleImage}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                      {related.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {related.authors?.[0]?.name || related.publisherName}
                      </span>
                      <span>{related.readDuration} {t("articleCard.minRead")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

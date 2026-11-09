import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { getArticle } from "@/lib/articles/getArticle";
import RichContent from "@/components/RichContent";
import PremiumGate from "@/components/PremiumGate/PremiumGate";
import en from "@/locales/en.json";
import he from "@/locales/he.json";
import type { ArticlePageProps } from "@/types/Articles/articles";
import { formatDate } from "@/lib/utils/date";

/**
 * Reading mode: the article alone (title, byline, body), with no navbar,
 * breadcrumbs or footer. Those components hide themselves on this path
 * (see isReaderPath). Opened in a new tab from the article page.
 */

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article || !article.published) {
    return { title: "Article Not Found" };
  }

  return {
    title: article.title,
    // The full article page is the indexable version; this is a view of it
    alternates: { canonical: `/articles/${article.slug || article.id}` },
    robots: { index: false, follow: true },
  };
}

export default async function ArticleReadingModePage({
  params,
}: ArticlePageProps) {
  const { id } = await params;
  const [article, session] = await Promise.all([
    getArticle(id),
    getServerSession(authOptions),
  ]);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  // Same visibility rule as the article page: drafts are admin-only
  if (!article || (!article.published && !isAuthorized)) {
    notFound();
  }

  // Labels follow the article's language, matching the article page
  const locale = article.direction === "rtl" ? "he" : "en";
  const translations = locale === "he" ? he : en;
  const t = (key: string): string => {
    let value: unknown = translations;
    for (const k of key.split(".")) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };

  const titleDir = article.titleDirection || "rtl";
  const contentDir = article.direction || (locale === "en" ? "ltr" : "rtl");
  const byline =
    article.authors && article.authors.length > 0
      ? article.authors.map((a) => a.name).join(", ")
      : article.publisherName || t("articleCard.authorAnonymous");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <article className="mx-auto max-w-[44rem] px-5 sm:px-8 py-12 sm:py-20">
        <header className="mb-10 sm:mb-14 border-b border-gray-200 dark:border-gray-800 pb-8">
          <h1
            dir={titleDir}
            className="font-serif text-3xl sm:text-5xl font-bold leading-tight text-gray-900 dark:text-gray-50"
          >
            {article.title}
          </h1>

          {article.subtitle && (
            <p
              dir={titleDir}
              className="mt-4 text-lg sm:text-xl leading-relaxed text-gray-600 dark:text-gray-400"
            >
              {article.subtitle}
            </p>
          )}

          <p
            dir={titleDir}
            className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {byline}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(article.createdAt, locale)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {article.readDuration} {t("articleCard.minRead")}
            </span>
          </p>
        </header>

        <PremiumGate
          isPremium={article.isPremium}
          previewContent={
            <div dir={contentDir} className="article-content">
              <RichContent
                content={article.content.slice(0, 500) + "..."}
                className="text-lg sm:text-xl text-gray-800 dark:text-gray-200"
              />
            </div>
          }
        >
          <div dir={contentDir} className="article-content">
            <RichContent
              content={article.content}
              className="text-lg sm:text-xl text-gray-800 dark:text-gray-200"
            />
          </div>
        </PremiumGate>
      </article>
    </div>
  );
}

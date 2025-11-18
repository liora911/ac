"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useArticle } from "@/hooks/useArticles";

type CrumbTemplate = {
  href?: string;
  labelKey?: string;
  rawSegment?: string;
  label?: string;
  isCurrent?: boolean;
};

const STATIC_SEGMENT_KEYS: Record<string, string> = {
  articles: "nav.articles",
  presentations: "nav.presentations",
  lectures: "nav.lectures",
  events: "nav.events",
  contact: "nav.contact",
  elitzur: "breadcrumbs.adminDashboard",
  "edit-article": "editArticlePage.title",
  "edit-lecture": "editLecturePage.title",
  "edit-presentation": "editPresentationPage.title",
  "create-lecture": "createLecturePage.title",
};

function buildCrumbs(pathname: string): CrumbTemplate[] {
  const cleanPath = pathname.split("?")[0];

  if (cleanPath === "/") {
    return [];
  }

  const segments = cleanPath.split("/").filter(Boolean);

  const crumbs: CrumbTemplate[] = [];

  // Home
  crumbs.push({
    href: "/",
    labelKey: "breadcrumbs.home",
  });

  let accumulatedPath = "";

  segments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const labelKey = STATIC_SEGMENT_KEYS[segment];

    crumbs.push({
      href: !isLast ? accumulatedPath : undefined,
      labelKey,
      rawSegment: labelKey ? undefined : segment,
      isCurrent: isLast,
    });
  });

  return crumbs;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();

  // Detect article detail pages to replace the ID with the article title
  const cleanPath = pathname?.split("?")[0] ?? "";
  const pathSegments = cleanPath.split("/").filter(Boolean);
  const isArticleDetailPage =
    pathSegments[0] === "articles" &&
    !!pathSegments[1] &&
    pathSegments.length === 2;
  const articleId = isArticleDetailPage
    ? (pathSegments[1] as string)
    : undefined;

  // Will be a no-op (disabled query) when articleId is undefined
  const { data: article } = useArticle(articleId);

  if (!pathname || pathname === "/") {
    return null;
  }

  let templates = buildCrumbs(pathname);

  // For /articles/[id] pages, replace the last segment (ID) with the article title
  if (articleId && article?.title) {
    templates = templates.map((template) =>
      template.rawSegment === articleId && template.isCurrent
        ? {
            ...template,
            label: article.title,
          }
        : template
    );
  }

  if (templates.length === 0) {
    return null;
  }

  const crumbs = templates.map((template, index) => {
    const isLast = index === templates.length - 1;
    const label = template.label
      ? template.label
      : template.labelKey
      ? t(template.labelKey)
      : decodeURIComponent(template.rawSegment ?? "");

    return {
      href: template.href,
      label,
      isCurrent: template.isCurrent ?? isLast,
    };
  });

  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <nav
      aria-label={t("breadcrumbs.ariaLabel")}
      className="border-b border-gray-100 bg-white/80 backdrop-blur-sm px-4 py-2 text-xs sm:text-sm text-gray-500"
      dir={dir}
    >
      <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-1 sm:gap-2">
            {crumb.href && !crumb.isCurrent ? (
              <Link
                href={crumb.href}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={crumb.isCurrent ? "page" : undefined}
                className={crumb.isCurrent ? "font-semibold text-gray-700" : ""}
              >
                {crumb.label}
              </span>
            )}
            {index < crumbs.length - 1 && (
              <span className="text-gray-300">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useArticle } from "@/hooks/useArticles";
import { useEvent } from "@/hooks/useEvents";
import { useLecture } from "@/hooks/useLectures";
import { usePresentation } from "@/hooks/usePresentations";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import type { CrumbTemplate } from "@/types/Breadcrumbs/breadcrumbs";
import { STATIC_SEGMENT_KEYS, NON_CLICKABLE_SEGMENTS } from "@/constants/breadcrumbs";

function buildCrumbs(pathname: string): CrumbTemplate[] {
  const cleanPath = pathname.split("?")[0];

  if (cleanPath === "/") {
    return [];
  }

  const segments = cleanPath.split("/").filter(Boolean);

  const crumbs: CrumbTemplate[] = [];

  crumbs.push({
    href: "/",
    labelKey: "breadcrumbs.home",
  });

  let accumulatedPath = "";

  segments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const labelKey = STATIC_SEGMENT_KEYS[segment];

    // Don't make segment clickable if it's the last one OR if it leads to a 404
    const shouldBeClickable =
      !isLast && !NON_CLICKABLE_SEGMENTS.has(segment);

    crumbs.push({
      href: shouldBeClickable ? accumulatedPath : undefined,
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

  const cleanPath = pathname?.split("?")[0] ?? "";
  const pathSegments = cleanPath.split("/").filter(Boolean);

  const articleId =
    pathSegments[0] === "articles" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : pathSegments[0] === "edit-article" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : undefined;

  const eventId =
    pathSegments[0] === "events" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : pathSegments[0] === "edit-event" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : pathSegments[0] === "elitzur" && pathSegments[1] === "events" && !!pathSegments[2]
      ? (pathSegments[2] as string)
      : undefined;

  const lectureId =
    pathSegments[0] === "lectures" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : pathSegments[0] === "edit-lecture" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : undefined;

  const presentationId =
    pathSegments[0] === "presentations" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : pathSegments[0] === "edit-presentation" && !!pathSegments[1]
      ? (pathSegments[1] as string)
      : undefined;

  const { data: article, isLoading: isArticleLoading } = useArticle(articleId);
  const { data: event, isLoading: isEventLoading } = useEvent(eventId);
  const { data: lecture, isLoading: isLectureLoading } = useLecture(lectureId);
  const { data: presentation, isLoading: isPresentationLoading } =
    usePresentation(presentationId);

  // Hide breadcrumbs on home page, auth pages, and list pages with hero banners
  const listPagesWithHero = ["/articles", "/lectures", "/presentations", "/events", "/browse"];
  const isListPage = listPagesWithHero.includes(pathname);

  if (!pathname || pathname === "/" || pathname.startsWith("/auth") || isListPage) {
    return null;
  }

  let templates = buildCrumbs(pathname);

  // Helper: insert a category crumb before the item crumb
  const insertCategoryCrumb = (
    tmpls: CrumbTemplate[],
    itemSegment: string,
    itemTitle: string,
    category: { id: string; name: string } | undefined,
    sectionPath: string,
  ): CrumbTemplate[] => {
    const result: CrumbTemplate[] = [];
    for (const template of tmpls) {
      if (template.rawSegment === itemSegment) {
        if (category) {
          result.push({
            href: `${sectionPath}?categoryId=${category.id}`,
            label: category.name,
          });
        }
        result.push({ ...template, label: itemTitle, isCurrent: true });
      } else {
        result.push(template);
      }
    }
    return result;
  };

  if (articleId && article?.title) {
    templates = insertCategoryCrumb(
      templates, articleId, article.title, article.category, "/articles"
    );
  }

  if (eventId && event?.title) {
    templates = insertCategoryCrumb(
      templates, eventId, event.title, event.category, "/events"
    );
  }

  if (lectureId && lecture?.title) {
    templates = insertCategoryCrumb(
      templates, lectureId, lecture.title, lecture.category, "/lectures"
    );
  }

  if (presentationId && presentation?.title) {
    templates = insertCategoryCrumb(
      templates, presentationId, presentation.title, presentation.category, "/presentations"
    );
  }

  if (templates.length === 0) {
    return null;
  }

  const crumbs = templates.map((template, index) => {
    const isLast = index === templates.length - 1;

    const isResourceIdSegment =
      !!template.rawSegment &&
      ((articleId &&
        template.rawSegment === articleId &&
        isArticleLoading &&
        !article) ||
        (eventId &&
          template.rawSegment === eventId &&
          isEventLoading &&
          !event) ||
        (lectureId &&
          template.rawSegment === lectureId &&
          isLectureLoading &&
          !lecture) ||
        (presentationId &&
          template.rawSegment === presentationId &&
          isPresentationLoading &&
          !presentation));

    const label: ReactNode = isResourceIdSegment ? (
      <span
        className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-middle"
        aria-label="Loading"
      />
    ) : template.label ? (
      template.label
    ) : template.labelKey ? (
      t(template.labelKey)
    ) : (
      // Replace dashes with spaces for better readability of slugs
      decodeURIComponent(template.rawSegment ?? "").replaceAll("-", " ")
    );

    return {
      href: template.href,
      label,
      isCurrent: template.isCurrent ?? isLast,
    };
  });

  const dir = locale === "he" ? "rtl" : "ltr";
  const isRTL = locale === "he";
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label={t("breadcrumbs.ariaLabel")}
      className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-2.5"
      dir={dir}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => {
          const isFirst = index === 0;
          const isLast = index === crumbs.length - 1;

          return (
            <li key={index} className="flex items-center">
              {/* Breadcrumb item */}
              {crumb.href && !crumb.isCurrent ? (
                <Link
                  href={crumb.href}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm
                    transition-all duration-200 ease-out
                    ${isFirst
                      ? "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    }
                  `}
                >
                  {isFirst && <Home className="w-3.5 h-3.5" />}
                  <span className={isFirst ? "sr-only sm:not-sr-only" : ""}>
                    {crumb.label}
                  </span>
                </Link>
              ) : (
                <span
                  aria-current={crumb.isCurrent ? "page" : undefined}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm
                    ${crumb.isCurrent
                      ? "font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 shadow-sm border border-gray-200/80 dark:border-gray-600/50"
                      : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {isFirst && <Home className="w-3.5 h-3.5" />}
                  <span className={`${isFirst ? "sr-only sm:not-sr-only" : ""} max-w-[200px] truncate`}>
                    {crumb.label}
                  </span>
                </span>
              )}

              {/* Separator */}
              {!isLast && (
                <Chevron className="w-4 h-4 mx-1 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

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

type CrumbTemplate = {
  href?: string;
  labelKey?: string;
  rawSegment?: string;
  label?: ReactNode;
  isCurrent?: boolean;
};

const STATIC_SEGMENT_KEYS: Record<string, string> = {
  // Main navigation
  articles: "nav.articles",
  article: "nav.articles",
  presentations: "nav.presentations",
  lectures: "nav.lectures",
  events: "nav.events",
  contact: "nav.contact",
  search: "breadcrumbs.search",
  // Admin
  elitzur: "breadcrumbs.adminDashboard",
  // Edit pages (root level pattern)
  "edit-article": "breadcrumbs.edit",
  "edit-lecture": "breadcrumbs.edit",
  "edit-presentation": "breadcrumbs.edit",
  "edit-event": "breadcrumbs.edit",
  // Create pages
  "create-lecture": "breadcrumbs.createNew",
  "create-presentation": "breadcrumbs.createNew",
  "create-event": "breadcrumbs.createNew",
  create: "breadcrumbs.createNew",
  // Nested edit (for /articles/[id]/edit pattern)
  edit: "breadcrumbs.edit",
  // Tickets
  "ticket-acquire": "breadcrumbs.reserveTicket",
  "ticket-summary": "breadcrumbs.ticketSummary",
};

// Segments that should NOT be clickable (no page exists at that path)
const NON_CLICKABLE_SEGMENTS = new Set([
  "edit-article",
  "edit-lecture",
  "edit-presentation",
  "edit-event",
  "create-lecture",
  "create-presentation",
  "create-event",
  "ticket-summary",
]);

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

  if (!pathname || pathname === "/") {
    return null;
  }

  let templates = buildCrumbs(pathname);

  if (articleId && article?.title) {
    templates = templates.map((template) =>
      template.rawSegment === articleId
        ? {
            ...template,
            label: article.title,
          }
        : template
    );
  }

  if (eventId && event?.title) {
    templates = templates.map((template) =>
      template.rawSegment === eventId
        ? {
            ...template,
            label: event.title,
          }
        : template
    );
  }

  if (lectureId && lecture?.title) {
    templates = templates.map((template) =>
      template.rawSegment === lectureId
        ? {
            ...template,
            label: lecture.title,
          }
        : template
    );
  }

  if (presentationId && presentation?.title) {
    templates = templates.map((template) =>
      template.rawSegment === presentationId
        ? {
            ...template,
            label: presentation.title,
          }
        : template
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
      decodeURIComponent(template.rawSegment ?? "")
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
      className="sticky top-0 z-40 bg-gradient-to-r from-gray-50/95 to-gray-100/80 dark:from-gray-900/95 dark:to-gray-800/80 backdrop-blur-sm border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-2.5"
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

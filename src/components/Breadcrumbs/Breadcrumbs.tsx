"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useArticle } from "@/hooks/useArticles";
import { useEvent } from "@/hooks/useEvents";
import { useLecture } from "@/hooks/useLectures";
import { usePresentation } from "@/hooks/usePresentations";

type CrumbTemplate = {
  href?: string;
  labelKey?: string;
  rawSegment?: string;
  label?: ReactNode;
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
  edit: "breadcrumbs.edit",
};

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

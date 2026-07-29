"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { normalizeExternalUrl } from "@/lib/utils/url";
import type { WidgetComponentProps } from "@/types/Widgets/widgets";

function readConfig(config: WidgetComponentProps["config"]) {
  const c = (config ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    heading: str(c.heading),
    body: str(c.body),
    buttonLabel: str(c.buttonLabel),
    buttonUrl: str(c.buttonUrl),
  };
}

function ButtonLink({ label, url }: { label: string; url: string }) {
  if (!label || !url) return null;
  const isInternal = url.startsWith("/");
  const href = isInternal ? url : normalizeExternalUrl(url) ?? url;
  const cls =
    "inline-flex items-center rounded-lg bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-semibold transition-colors";
  return isInternal ? (
    <Link href={href} className={cls}>
      {label}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label}
    </a>
  );
}

export function AnnouncementBanner({ config }: WidgetComponentProps) {
  const { locale } = useTranslation();
  const { heading, body, buttonLabel, buttonUrl } = readConfig(config);
  if (!heading && !body) return null;
  return (
    <div
      dir={locale === "he" ? "rtl" : "ltr"}
      className="rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-indigo-600 p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center gap-4"
    >
      <Megaphone className="w-8 h-8 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {heading && <h3 className="text-lg md:text-xl font-bold">{heading}</h3>}
        {body && <p className="mt-1 text-sm text-white/90">{body}</p>}
      </div>
      <ButtonLink label={buttonLabel} url={buttonUrl} />
    </div>
  );
}

export function AnnouncementCard({ config }: WidgetComponentProps) {
  const { locale } = useTranslation();
  const { heading, body, buttonLabel, buttonUrl } = readConfig(config);
  if (!heading && !body) return null;
  return (
    <div
      dir={locale === "he" ? "rtl" : "ltr"}
      className="max-w-2xl mx-auto rounded-2xl border-2 border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-900/20 p-6 text-center"
    >
      <Megaphone className="w-8 h-8 text-orange-500 mx-auto mb-2" />
      {heading && (
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {heading}
        </h3>
      )}
      {body && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{body}</p>
      )}
      {buttonLabel && buttonUrl && (
        <div className="mt-4">
          <Link
            href={
              buttonUrl.startsWith("/")
                ? buttonUrl
                : normalizeExternalUrl(buttonUrl) ?? buttonUrl
            }
            target={buttonUrl.startsWith("/") ? undefined : "_blank"}
            rel={buttonUrl.startsWith("/") ? undefined : "noopener noreferrer"}
            className="inline-flex items-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-semibold transition-colors"
          >
            {buttonLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

// Admin card preview — sample content so the professor sees the shape
export function AnnouncementPreview() {
  return (
    <div className="rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-indigo-600 p-4 text-white flex items-center gap-3">
      <Megaphone className="w-6 h-6 flex-shrink-0" />
      <div className="text-start">
        <div className="text-sm font-bold">Announcement</div>
        <div className="text-xs text-white/80">Your message here…</div>
      </div>
    </div>
  );
}

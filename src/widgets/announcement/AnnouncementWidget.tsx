"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { normalizeExternalUrl } from "@/lib/utils/url";
import { isHex, readableTextColor } from "../colorUtils";
import type { WidgetComponentProps } from "@/types/Widgets/widgets";

type AnnouncementColor = "sunset" | "ocean" | "forest" | "slate";

const GRADIENTS: Record<AnnouncementColor, string> = {
  sunset: "from-orange-500 via-red-500 to-indigo-600",
  ocean: "from-blue-600 via-indigo-600 to-violet-600",
  forest: "from-teal-500 via-emerald-600 to-green-600",
  slate: "from-slate-700 via-slate-600 to-slate-800",
};

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

function AnnouncementBase({
  color,
  config,
  sample,
}: {
  color: AnnouncementColor;
  config?: WidgetComponentProps["config"];
  sample?: boolean;
}) {
  const { locale } = useTranslation();
  const { heading, body, buttonLabel, buttonUrl } = readConfig(config);
  const raw = config?.color;
  const custom = isHex(raw) ? raw : null;

  const showHeading = heading || (sample ? "Announcement" : "");
  const showBody = body || (sample ? "Your message here…" : "");
  if (!showHeading && !showBody) return null;

  const isInternal = buttonUrl.startsWith("/");
  const href = isInternal ? buttonUrl : normalizeExternalUrl(buttonUrl) ?? buttonUrl;
  const buttonCls =
    "inline-flex items-center rounded-lg bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-semibold transition-colors flex-shrink-0";

  return (
    <div
      dir={locale === "he" ? "rtl" : "ltr"}
      style={
        custom ? { background: custom, color: readableTextColor(custom) } : undefined
      }
      className={`rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row md:items-center gap-4 ${
        custom ? "" : `bg-gradient-to-r ${GRADIENTS[color]} text-white`
      }`}
    >
      <Megaphone className="w-8 h-8 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {showHeading && (
          <h3 className="text-lg md:text-xl font-bold">{showHeading}</h3>
        )}
        {showBody && (
          <p className={`mt-1 text-sm ${custom ? "opacity-90" : "text-white/90"}`}>
            {showBody}
          </p>
        )}
      </div>
      {buttonLabel && buttonUrl && (
        <>
          {isInternal ? (
            <Link href={href} className={buttonCls}>
              {buttonLabel}
            </Link>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonCls}
            >
              {buttonLabel}
            </a>
          )}
        </>
      )}
    </div>
  );
}

export function AnnouncementSunset(props: WidgetComponentProps) {
  return <AnnouncementBase color="sunset" config={props.config} />;
}
export function AnnouncementOcean(props: WidgetComponentProps) {
  return <AnnouncementBase color="ocean" config={props.config} />;
}
export function AnnouncementForest(props: WidgetComponentProps) {
  return <AnnouncementBase color="forest" config={props.config} />;
}
export function AnnouncementSlate(props: WidgetComponentProps) {
  return <AnnouncementBase color="slate" config={props.config} />;
}

// Admin card preview — sample content so the professor sees the shape
export function AnnouncementPreview() {
  return <AnnouncementBase color="sunset" sample />;
}

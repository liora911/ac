"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface UpcomingEvent {
  id: string;
  title: string;
  eventDate: string;
}

function useNextEvent() {
  const [event, setEvent] = useState<UpcomingEvent | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) return;
        const data = await res.json();
        const list: UpcomingEvent[] = Array.isArray(data) ? data : [];
        const now = Date.now();
        const upcoming = list
          .filter((e) => e.eventDate && new Date(e.eventDate).getTime() > now)
          .sort(
            (a, b) =>
              new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          );
        if (active) setEvent(upcoming[0] ?? null);
      } catch {
        // network/parse error — leave the slot empty
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return event;
}

function useRemaining(target: string | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () =>
      setRemaining(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);
  return remaining;
}

function breakdown(ms: number) {
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl md:text-3xl font-bold tabular-nums" suppressHydrationWarning>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">
        {label}
      </span>
    </div>
  );
}

function useCountdownData() {
  const { t, locale } = useTranslation();
  const event = useNextEvent();
  const remaining = useRemaining(event?.eventDate);
  const isRTL = locale === "he";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const parts = remaining != null ? breakdown(remaining) : null;
  return { t, isRTL, Arrow, event, parts };
}

export function CountdownCompact() {
  const { t, isRTL, Arrow, event, parts } = useCountdownData();
  if (!event || !parts) return null;
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="max-w-3xl mx-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center gap-4 shadow-sm"
    >
      <CalendarClock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("widgets.items.countdown.labels.upcoming")}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {event.title}
        </p>
      </div>
      <div className="flex items-center gap-3 text-gray-900 dark:text-white flex-shrink-0">
        <Unit value={parts.days} label={t("widgets.items.countdown.labels.days")} />
        <Unit value={parts.hours} label={t("widgets.items.countdown.labels.hours")} />
        <Unit value={parts.minutes} label={t("widgets.items.countdown.labels.minutes")} />
      </div>
      <Link
        href={`/events/${event.id}`}
        className="flex-shrink-0 p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        aria-label={event.title}
      >
        <Arrow className="w-5 h-5" />
      </Link>
    </div>
  );
}

export function CountdownFeatured() {
  const { t, isRTL, event, parts } = useCountdownData();
  if (!event || !parts) return null;
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-center text-white shadow-lg"
    >
      <p className="text-sm font-medium text-white/80">
        {t("widgets.items.countdown.labels.upcoming")}
      </p>
      <h3 className="mt-1 text-xl md:text-2xl font-bold">{event.title}</h3>
      <div className="mt-5 flex items-center justify-center gap-5">
        <Unit value={parts.days} label={t("widgets.items.countdown.labels.days")} />
        <Unit value={parts.hours} label={t("widgets.items.countdown.labels.hours")} />
        <Unit value={parts.minutes} label={t("widgets.items.countdown.labels.minutes")} />
        <Unit value={parts.seconds} label={t("widgets.items.countdown.labels.seconds")} />
      </div>
      <Link
        href={`/events/${event.id}`}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-medium transition-colors"
      >
        {t("widgets.items.countdown.labels.viewEvent")}
      </Link>
    </div>
  );
}

export function CountdownPreview() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center gap-3">
      <CalendarClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
        <Unit value={12} label={t("widgets.items.countdown.labels.days")} />
        <Unit value={6} label={t("widgets.items.countdown.labels.hours")} />
        <Unit value={30} label={t("widgets.items.countdown.labels.minutes")} />
      </div>
    </div>
  );
}

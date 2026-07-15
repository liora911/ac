"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import {
  usePersonalEvents,
  useCreatePersonalEvent,
  useUpdatePersonalEvent,
  useDeletePersonalEvent,
  type PersonalEvent,
} from "@/hooks/usePersonalEvents";
import Modal from "@/components/Modal/Modal";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Clock,
} from "lucide-react";

// Chip palette — same family as the idea notes
const ENTRY_COLORS: { key: string | null; chip: string; swatch: string }[] = [
  {
    key: null,
    chip: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
    swatch: "bg-blue-200 border-blue-300",
  },
  {
    key: "amber",
    chip: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200",
    swatch: "bg-amber-200 border-amber-300",
  },
  {
    key: "green",
    chip: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
    swatch: "bg-green-200 border-green-300",
  },
  {
    key: "pink",
    chip: "bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200",
    swatch: "bg-pink-200 border-pink-300",
  },
  {
    key: "purple",
    chip: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
    swatch: "bg-purple-200 border-purple-300",
  },
];

const chipClassFor = (color: string | null) =>
  (ENTRY_COLORS.find((c) => c.key === color) ?? ENTRY_COLORS[0]).chip;

const dayKey = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toISOString().slice(0, 10);
};

const localDayKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

type DialogState = {
  date: string; // "YYYY-MM-DD"
  entry: PersonalEvent | null;
};

export default function CalendarAdmin() {
  const { t, locale } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const { data: events, isLoading } = usePersonalEvents();
  const createEvent = useCreatePersonalEvent();
  const updateEvent = useUpdatePersonalEvent();
  const deleteEvent = useDeletePersonalEvent();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Dialog form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<string | null>(null);

  const saving = createEvent.isPending || updateEvent.isPending;

  const byDay = useMemo(() => {
    const map = new Map<string, PersonalEvent[]>();
    for (const ev of events ?? []) {
      const key = dayKey(ev.date);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const openDialog = (date: string, entry: PersonalEvent | null) => {
    setTitle(entry?.title ?? "");
    setTime(entry?.time ?? "");
    setNote(entry?.note ?? "");
    setColor(entry?.color ?? null);
    setDialog({ date, entry });
  };

  const closeDialog = () => {
    setDialog(null);
    setShowDeleteModal(false);
  };

  const handleSave = async () => {
    if (!dialog) return;
    if (!title.trim()) {
      showError(t("adminCalendar.titleRequired"));
      return;
    }
    const payload = {
      title,
      note,
      time: time || null,
      color,
      date: dialog.date,
    };
    try {
      if (dialog.entry) {
        await updateEvent.mutateAsync({ id: dialog.entry.id, ...payload });
      } else {
        await createEvent.mutateAsync(payload);
      }
      showSuccess(t("adminCalendar.savedSuccess"));
      closeDialog();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : t("adminCalendar.errorGeneric")
      );
    }
  };

  const handleDelete = async () => {
    if (!dialog?.entry) return;
    try {
      await deleteEvent.mutateAsync(dialog.entry.id);
      showSuccess(t("adminCalendar.deletedSuccess"));
      closeDialog();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : t("adminCalendar.errorGeneric")
      );
    }
  };

  const goMonth = (dir: -1 | 1) => {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const intlLocale = locale === "he" ? "he-IL" : "en-US";
  const monthLabel = new Date(year, month, 1).toLocaleDateString(intlLocale, {
    month: "long",
    year: "numeric",
  });
  // Sunday-first, matching both Hebrew and US conventions
  const weekdayLabels = useMemo(() => {
    const base = new Date(Date.UTC(2023, 0, 1)); // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getTime() + i * 86400000).toLocaleDateString(intlLocale, {
        weekday: "short",
        timeZone: "UTC",
      })
    );
  }, [intlLocale]);

  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKeyStr = localDayKey(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const PrevIcon = locale === "he" ? ChevronRight : ChevronLeft;
  const NextIcon = locale === "he" ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("adminCalendar.deleteTitle")}
        message={t("adminCalendar.deleteMessage")}
        showCancel
        cancelText={t("adminCalendar.cancel")}
        confirmText={t("adminCalendar.confirmDelete")}
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("adminCalendar.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("adminCalendar.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {t("adminCalendar.today")}
          </button>
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label={t("adminCalendar.prevMonth")}
          >
            <PrevIcon className="w-4 h-4" />
          </button>
          <span className="min-w-[10rem] text-center text-lg font-semibold text-gray-900 dark:text-white">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label={t("adminCalendar.nextMonth")}
          >
            <NextIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }, (_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-[7rem] border-b border-e border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30"
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = localDayKey(year, month, day);
              const entries = byDay.get(key) ?? [];
              const isToday = key === todayKeyStr;
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDialog(key, null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openDialog(key, null);
                  }}
                  className="group min-h-[7rem] border-b border-e border-gray-100 dark:border-gray-700/60 p-1.5 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-1 space-y-1">
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog(key, entry);
                        }}
                        dir="auto"
                        className={`w-full text-start px-1.5 py-1 rounded text-[11px] font-medium leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity ${chipClassFor(entry.color)}`}
                        title={entry.title}
                      >
                        {entry.time && (
                          <span className="font-semibold me-1">{entry.time}</span>
                        )}
                        {entry.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entry dialog */}
      {dialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeDialog}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {dialog.entry
                  ? t("adminCalendar.editEntry")
                  : t("adminCalendar.addEntry")}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {new Date(`${dialog.date}T00:00:00`).toLocaleDateString(
                  intlLocale,
                  { weekday: "long", day: "numeric", month: "long", year: "numeric" }
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("adminCalendar.entryTitle")} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                dir="auto"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <div className="w-32">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  {t("adminCalendar.time")}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("adminCalendar.color")}
                </label>
                <div className="flex items-center gap-1.5 pt-1.5">
                  {ENTRY_COLORS.map((c) => (
                    <button
                      key={c.key ?? "none"}
                      type="button"
                      onClick={() => setColor(c.key)}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${c.swatch} ${
                        color === c.key ? "ring-2 ring-blue-500 scale-110" : ""
                      }`}
                      aria-label={c.key ?? "default"}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("adminCalendar.note")}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                dir="auto"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              {dialog.entry && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("adminCalendar.delete")}
                </button>
              )}
              <div className="ms-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  {t("adminCalendar.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? t("adminCalendar.saving") : t("adminCalendar.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

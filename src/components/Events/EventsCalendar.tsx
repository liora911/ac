"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Event } from "@/types/Events/events";
import { ChevronLeft, ChevronRight, MapPin, Video, Calendar } from "lucide-react";

interface EventsCalendarProps {
  events: Event[];
}

interface DayEvents {
  date: Date;
  events: Event[];
}

export default function EventsCalendar({ events }: EventsCalendarProps) {
  const { t, locale } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<DayEvents | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const hoveredCellRef = useRef<HTMLButtonElement | null>(null);

  const isRTL = locale === "he";
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  // Get first and last day of current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = firstDayOfMonth.getDay();

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      const date = new Date(event.eventDate);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (DayEvents | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const dayEvents = eventsByDate.get(key) || [];
      days.push({ date, events: dayEvents });
    }

    return days;
  }, [currentDate, eventsByDate, startDayOfWeek, lastDayOfMonth]);

  // Week day names
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i); // Jan 2024 starts on Monday, but we want Sunday
      date.setDate(date.getDate() - date.getDay() + i);
      days.push(date.toLocaleDateString(dateLocale, { weekday: "short" }));
    }
    return days;
  }, [dateLocale]);

  const monthYear = currentDate.toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setHoveredDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setHoveredDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setHoveredDay(null);
  };

  const handleDayHover = (day: DayEvents | null, cellElement: HTMLButtonElement | null) => {
    if (day && day.events.length > 0 && cellElement) {
      hoveredCellRef.current = cellElement;
      setHoveredDay(day);

      // Calculate popover position
      const rect = cellElement.getBoundingClientRect();
      const calendarRect = calendarRef.current?.getBoundingClientRect();

      if (calendarRect) {
        const top = rect.bottom - calendarRect.top + 8;
        let left = rect.left - calendarRect.left + rect.width / 2;

        // Adjust if too close to edges
        const popoverWidth = 280;
        if (left < popoverWidth / 2) {
          left = popoverWidth / 2 + 8;
        } else if (left > calendarRect.width - popoverWidth / 2) {
          left = calendarRect.width - popoverWidth / 2 - 8;
        }

        setPopoverPosition({ top, left });
      }
    } else {
      setHoveredDay(null);
      setPopoverPosition(null);
    }
  };

  const handleDayClick = (day: DayEvents | null, cellElement: HTMLButtonElement) => {
    // On mobile, tap toggles the popover
    if (day && day.events.length > 0) {
      if (hoveredDay?.date.getTime() === day.date.getTime()) {
        setHoveredDay(null);
        setPopoverPosition(null);
      } else {
        handleDayHover(day, cellElement);
      }
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        setHoveredDay(null);
        setPopoverPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatEventTime = (event: Event) => {
    if (event.eventTime) return event.eventTime;
    const date = new Date(event.eventDate);
    return date.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      ref={calendarRef}
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={isRTL ? goToNextMonth : goToPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          aria-label={t("eventsCalendar.previousMonth")}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {monthYear}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            {t("eventsCalendar.today")}
          </button>
        </div>

        <button
          onClick={isRTL ? goToPrevMonth : goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          aria-label={t("eventsCalendar.nextMonth")}
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={(e) => day && handleDayClick(day, e.currentTarget)}
            onMouseEnter={(e) => handleDayHover(day, e.currentTarget)}
            onMouseLeave={() => {
              // Don't close immediately on mouse leave to allow moving to popover
              setTimeout(() => {
                if (!hoveredCellRef.current?.matches(":hover")) {
                  // Keep popover if we moved to it
                }
              }, 100);
            }}
            disabled={!day}
            className={`
              relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all
              ${!day ? "cursor-default" : "cursor-pointer"}
              ${day && isToday(day.date) ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500" : ""}
              ${day && !isToday(day.date) ? "hover:bg-gray-100 dark:hover:bg-gray-700" : ""}
              ${day?.events.length ? "font-semibold" : ""}
            `}
          >
            {day && (
              <>
                <span
                  className={`text-sm md:text-base ${
                    isToday(day.date)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {/* Event dots */}
                {day.events.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {day.events.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                    ))}
                    {day.events.length > 3 && (
                      <span className="text-[10px] text-blue-500 font-medium ms-0.5">
                        +{day.events.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Events popover */}
      {hoveredDay && hoveredDay.events.length > 0 && popoverPosition && (
        <div
          className="absolute z-50 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            transform: "translateX(-50%)",
          }}
          onMouseEnter={() => {
            // Keep popover open when hovering over it
          }}
          onMouseLeave={() => {
            setHoveredDay(null);
            setPopoverPosition(null);
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {hoveredDay.date.toLocaleDateString(dateLocale, {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {hoveredDay.events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1 h-full min-h-[2.5rem] rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatEventTime(event)}</span>
                      {event.eventType === "online" ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{t("eventsCalendar.eventIndicator")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500" />
          <span>{t("eventsCalendar.today")}</span>
        </div>
      </div>
    </div>
  );
}

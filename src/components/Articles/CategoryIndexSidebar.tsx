"use client";

import React, { useMemo, useRef } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";

type CategoryWithCount = {
  id: string;
  name: string;
  _count?: { articles: number };
};

interface CategoryIndexSidebarProps {
  categories: CategoryWithCount[];
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
  className?: string;
}

const isHebrewChar = (ch: string) => /[א-ת]/.test(ch);

// Phone-book style index: Hebrew letters first (א-ת), then Latin (A-Z),
// anything else under "#"
export default function CategoryIndexSidebar({
  categories,
  selectedCategory,
  onSelect,
  className = "",
}: CategoryIndexSidebarProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());

  const groups = useMemo(() => {
    const map = new Map<string, CategoryWithCount[]>();
    for (const cat of categories) {
      const first = cat.name.trim().charAt(0);
      const letter = isHebrewChar(first)
        ? first
        : /[a-z]/i.test(first)
          ? first.toUpperCase()
          : "#";
      const list = map.get(letter);
      if (list) list.push(cat);
      else map.set(letter, [cat]);
    }
    const letters = [...map.keys()].sort((a, b) => {
      const aHe = isHebrewChar(a);
      const bHe = isHebrewChar(b);
      if (aHe !== bHe) return aHe ? -1 : 1;
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b, aHe ? "he" : "en");
    });
    return letters.map((letter) => ({
      letter,
      items: [...map.get(letter)!].sort((x, y) =>
        x.name.localeCompare(y.name, isHebrewChar(letter) ? "he" : "en")
      ),
    }));
  }, [categories]);

  const jumpTo = (letter: string) => {
    const section = sectionRefs.current.get(letter);
    const container = listRef.current;
    if (section && container) {
      container.scrollTo({
        top: section.offsetTop - 4,
        behavior: "smooth",
      });
    }
  };

  const itemCls = (isActive: boolean) =>
    `w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-start transition-colors cursor-pointer ${
      isActive
        ? "bg-blue-600 text-white font-medium shadow-sm"
        : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
    }`;

  return (
    <aside className={`w-60 flex-shrink-0 sticky top-20 ${className}`}>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)]">
        <div className="px-3 pt-3 pb-2 text-sm font-semibold text-gray-900 dark:text-white">
          {t("articlesPage.topicsTitle")}
        </div>

        {/* Letter quick-jump strip */}
        {groups.length > 2 && (
          <div className="flex flex-wrap gap-0.5 px-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            {groups.map((g) => (
              <button
                key={g.letter}
                type="button"
                onClick={() => jumpTo(g.letter)}
                className="w-6 h-6 flex items-center justify-center rounded text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                aria-label={g.letter}
              >
                {g.letter}
              </button>
            ))}
          </div>
        )}

        {/* Category list, grouped by first letter */}
        <div ref={listRef} className="relative flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => onSelect("")}
            className={itemCls(!selectedCategory)}
          >
            <span className="truncate">{t("articlesPage.allTopics")}</span>
          </button>

          {groups.map((group) => (
            <div
              key={group.letter}
              ref={(el) => {
                if (el) sectionRefs.current.set(group.letter, el);
              }}
            >
              <div className="px-2.5 pt-3 pb-1 text-xs font-bold text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700/60 mb-1">
                {group.letter}
              </div>
              {group.items.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelect(isActive ? "" : cat.id)}
                    className={itemCls(isActive)}
                    dir="auto"
                  >
                    <span className="truncate">{cat.name}</span>
                    {cat._count != null && (
                      <span
                        className={`text-xs tabular-nums flex-shrink-0 ${
                          isActive
                            ? "text-blue-100"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {cat._count.articles}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

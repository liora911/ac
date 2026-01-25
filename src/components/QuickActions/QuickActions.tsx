"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/Translation/translation.context";
import {
  FileText,
  Video,
  Presentation,
  CalendarPlus,
  Plus,
} from "lucide-react";

const QuickActions: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const actions = [
    {
      labelKey: "quickActions.addArticle",
      icon: FileText,
      path: "/articles/create",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      labelKey: "quickActions.addLecture",
      icon: Video,
      path: "/create-lecture",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      labelKey: "quickActions.addPresentation",
      icon: Presentation,
      path: "/create-presentation",
      gradient: "from-orange-500 to-amber-600",
    },
    {
      labelKey: "quickActions.addEvent",
      icon: CalendarPlus,
      path: "/create-event",
      gradient: "from-green-500 to-emerald-600",
    },
  ];

  const handleActionClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("quickActions.title")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.path)}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.gradient} p-4 text-white shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] cursor-pointer`}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative flex flex-col items-center gap-2">
                {/* Icon with plus badge */}
                <div className="relative">
                  <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {/* Plus badge */}
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Plus className="w-2.5 h-2.5 text-gray-700" strokeWidth={3} />
                  </div>
                </div>

                {/* Label */}
                <span className="text-xs font-medium text-center leading-tight">
                  {t(action.labelKey)}
                </span>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Check, Sun, Moon } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useTheme } from "@/contexts/ThemeContext";
import { useCategoryPreferences } from "@/contexts/CategoryPreferencesContext";
import { useCategories } from "@/hooks/useArticles";

export default function WelcomeModal() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isRTL = locale === "he";
  const { shouldShowWelcome, setSelectedCategories, markWelcomeSeen } = useCategoryPreferences();
  const { data: categories, isLoading } = useCategories();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(true);

  // Reset selection when modal opens
  useEffect(() => {
    if (shouldShowWelcome) {
      setSelectedIds([]);
      setShowAll(true);
    }
  }, [shouldShowWelcome]);

  const toggleCategory = (categoryId: string) => {
    setShowAll(false);
    setSelectedIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleShowAll = () => {
    setShowAll(true);
    setSelectedIds([]);
  };

  const handleContinue = () => {
    // If "show all" is selected, don't filter anything
    if (showAll) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(selectedIds);
    }
    markWelcomeSeen();
  };

  const handleSkip = () => {
    // Skip = show all content (no filtering)
    setSelectedCategories([]);
    markWelcomeSeen();
  };

  if (!shouldShowWelcome) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Settings Bar - Language & Theme (Universal Icons) */}
          <div className="absolute top-2 right-3 left-3 flex justify-between items-center z-10">
            {/* Language Toggle */}
            <div className="flex gap-0.5 bg-white/20 backdrop-blur-sm rounded-md p-0.5">
              <button
                onClick={() => setLocale("en")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  locale === "en"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLocale("he")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  locale === "he"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="עברית"
              >
                עב
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center hover:bg-white/30 transition-all"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Header with gradient - compact */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 pt-10 pb-4 text-white text-center shrink-0">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-lg font-bold mb-1">
              {t("categoryPreferences.welcomeTitle") || "Welcome! What interests you?"}
            </h2>
            <p className="text-white/80 text-xs">
              {t("categoryPreferences.welcomeDescription") ||
                "Select topics to personalize your experience, or skip to see everything."}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 min-h-0">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Show All Option */}
                <button
                  onClick={handleShowAll}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all ${
                    showAll
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                      showAll
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  >
                    {showAll && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`font-medium text-sm ${
                      showAll
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {t("categoryPreferences.showAll") || "Show me everything"}
                  </span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("categoryPreferences.or") || "or select specific topics"}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                </div>

                {/* Category Checkboxes */}
                <div className="grid grid-cols-1 gap-1.5">
                  {categories?.map((category) => {
                    const isSelected = selectedIds.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300 dark:border-gray-500"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span
                          className={`font-medium text-xs ${
                            isSelected
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 space-y-2 shrink-0">
            <button
              onClick={handleContinue}
              disabled={!showAll && selectedIds.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {t("categoryPreferences.continue") || "Continue"}
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-1.5 px-4 text-gray-500 dark:text-gray-400 text-xs hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {t("categoryPreferences.skip") || "Skip for now"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

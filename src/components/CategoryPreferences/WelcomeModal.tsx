"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategoryPreferences } from "@/contexts/CategoryPreferencesContext";
import { useCategories } from "@/hooks/useArticles";

export default function WelcomeModal() {
  const { t, locale } = useTranslation();
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
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {t("categoryPreferences.welcomeTitle") || "Welcome! What interests you?"}
            </h2>
            <p className="text-white/80 text-sm">
              {t("categoryPreferences.welcomeDescription") ||
                "Select topics to personalize your experience, or skip to see everything."}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show All Option */}
                <button
                  onClick={handleShowAll}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    showAll
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      showAll
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-500"
                    }`}
                  >
                    {showAll && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span
                    className={`font-medium ${
                      showAll
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {t("categoryPreferences.showAll") || "Show me everything"}
                  </span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t("categoryPreferences.or") || "or select specific topics"}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                </div>

                {/* Category Checkboxes */}
                <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {categories?.map((category) => {
                    const isSelected = selectedIds.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300 dark:border-gray-500"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`font-medium text-sm ${
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
          <div className="px-6 pb-6">
            <button
              onClick={handleContinue}
              disabled={!showAll && selectedIds.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {t("categoryPreferences.continue") || "Continue"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

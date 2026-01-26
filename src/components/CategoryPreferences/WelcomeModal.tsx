"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Check, Sun, Moon, Ticket, Heart, Crown, Globe } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useTheme } from "@/contexts/ThemeContext";
import { useCategoryPreferences } from "@/contexts/CategoryPreferencesContext";
import { useCategories } from "@/hooks/useArticles";
import { useRouter } from "next/navigation";

export default function WelcomeModal() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isRTL = locale === "he";
  const { shouldShowWelcome, setSelectedCategories, markWelcomeSeen } = useCategoryPreferences();
  const { data: categories, isLoading } = useCategories();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(true);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Reset selection when modal opens
  useEffect(() => {
    if (shouldShowWelcome) {
      setSelectedIds([]);
      setShowAll(true);
      setStep(0);
    }
  }, [shouldShowWelcome]);

  const handleLanguageSelect = (lang: "en" | "he") => {
    setLocale(lang);
    setStep(1);
  };

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
    // Move to step 2 instead of closing
    setStep(2);
  };

  const handleSkip = () => {
    // Skip = show all content (no filtering), go to step 2
    setSelectedCategories([]);
    setStep(2);
  };

  const handleRegister = () => {
    markWelcomeSeen();
    router.push("/auth/login");
  };

  const handleGuest = () => {
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
          {/* Theme Toggle - only show after language selection */}
          {step > 0 && (
            <div className="absolute top-2 right-3 z-10">
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
          )}

          {step === 0 ? (
            <>
              {/* Step 0: Language Selection */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-12 text-white text-center flex-1 flex flex-col items-center justify-center">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <Globe className="w-7 h-7" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2">
                  Choose Your Language
                </h2>
                <p className="text-white/80 text-sm mb-8">
                  בחר את השפה שלך
                </p>

                <div className="flex gap-4 w-full max-w-xs">
                  <button
                    onClick={() => handleLanguageSelect("he")}
                    className="flex-1 py-4 px-6 rounded-xl bg-white text-blue-700 font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    עברית
                  </button>
                  <button
                    onClick={() => handleLanguageSelect("en")}
                    className="flex-1 py-4 px-6 rounded-xl bg-white text-blue-700 font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                  >
                    English
                  </button>
                </div>
              </div>
            </>
          ) : step === 1 ? (
            <>
              {/* Step 1: Header with gradient - compact */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-10 pb-4 text-white text-center shrink-0">
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

              {/* Step 1: Content */}
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
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300 dark:border-gray-500"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span
                              className={`font-medium text-xs ${
                                isSelected
                                  ? "text-blue-700 dark:text-blue-300"
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

              {/* Step 1: Footer */}
              <div className="px-4 pb-4 space-y-2 shrink-0">
                <button
                  onClick={handleContinue}
                  disabled={!showAll && selectedIds.length === 0}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
            </>
          ) : (
            <>
              {/* Step 2: Header */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-10 pb-4 text-white text-center shrink-0">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                </div>
                <h2 className="text-lg font-bold mb-1">
                  {t("categoryPreferences.step2Title") || "Create an Account?"}
                </h2>
                <p className="text-white/80 text-xs">
                  {t("categoryPreferences.step2Description") ||
                    "Unlock additional features with a free account"}
                </p>
              </div>

              {/* Step 2: Content - Benefits list */}
              <div className="p-4 flex-1 min-h-0">
                <div className="space-y-3">
                  {/* Benefit: Ticket Management */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                        {t("categoryPreferences.benefitTickets") || "Event Tickets"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("categoryPreferences.benefitTicketsDesc") ||
                          "Purchase and manage your event tickets in one place"}
                      </p>
                    </div>
                  </div>

                  {/* Benefit: Favorites */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                        {t("categoryPreferences.benefitFavorites") || "Save Favorites"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("categoryPreferences.benefitFavoritesDesc") ||
                          "Save articles, lectures, and presentations to revisit later"}
                      </p>
                    </div>
                  </div>

                  {/* Benefit: Premium */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                      <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                        {t("categoryPreferences.benefitPremium") || "Premium Content"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("categoryPreferences.benefitPremiumDesc") ||
                          "Subscribe to access exclusive content and support Avshalom's research"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Footer */}
              <div className="px-4 pb-4 space-y-2 shrink-0">
                <button
                  onClick={handleRegister}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  {t("categoryPreferences.register") || "Register"}
                </button>
                <button
                  onClick={handleGuest}
                  className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("categoryPreferences.enterAsGuest") || "Enter as Guest"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

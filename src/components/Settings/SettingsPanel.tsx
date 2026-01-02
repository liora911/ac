"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";
import LanguageToggle from "./LanguageToggle";
import ThemeToggleSection from "./ThemeToggleSection";
import FontSizeToggle from "./FontSizeToggle";
import ReduceMotionToggle from "./ReduceMotionToggle";
import DefaultViewToggle from "./DefaultViewToggle";

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-y-0 ${isRTL ? "left-0" : "right-0"} z-[101] w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("settings.title")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              {/* Language Toggle Section */}
              <LanguageToggle />

              {/* Theme Toggle Section */}
              <ThemeToggleSection />

              {/* Font Size Toggle Section */}
              <FontSizeToggle />

              {/* Reduce Motion Toggle Section */}
              <ReduceMotionToggle />

              {/* Default View Toggle Section */}
              <DefaultViewToggle />
            </div>

            {/* Support Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("settings.supportMessage")}{" "}
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {t("settings.contactUs")}
                </Link>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level to escape any container constraints
  if (!mounted) return null;

  return createPortal(drawerContent, document.body);
}

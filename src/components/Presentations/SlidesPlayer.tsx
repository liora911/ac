"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface SlidesPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  embedUrl: string;
  title: string;
  googleSlidesUrl?: string;
}

export default function SlidesPlayer({
  isOpen,
  onClose,
  embedUrl,
  title,
  googleSlidesUrl,
}: SlidesPlayerProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  const playerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black"
            onClick={onClose}
          />

          {/* Player Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900/95 border-b border-gray-700 shrink-0">
              <h2 className="text-lg font-semibold text-white truncate max-w-[60%]">
                {title}
              </h2>
              <div className="flex items-center gap-2">
                {googleSlidesUrl && (
                  <a
                    href={googleSlidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title={t("presentationDetail.openInGoogleSlides")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("presentationDetail.openInGoogleSlides")}</span>
                  </a>
                )}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title={isFullscreen ? t("presentationDetail.exitFullscreen") : t("presentationDetail.enterFullscreen")}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title={t("common.close")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slides iframe */}
            <div className="flex-1 bg-black">
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-gray-900/95 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-400">
                {t("presentationDetail.playerHint")}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(playerContent, document.body);
}

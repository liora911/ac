"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Maximize2, Minimize2, ChevronDown, ChevronUp, Lock, ArrowRight, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LectureModalProps } from "@/types/Lectures/lectures";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useSession } from "next-auth/react";
import { useNotification } from "@/contexts/NotificationContext";
import Link from "next/link";
import RichContent from "@/components/RichContent";
import FavoriteButton from "@/components/FavoriteButton";
import { formatDate } from "@/lib/utils/date";
import { shareItem } from "@/lib/utils/share";

const LectureModal: React.FC<LectureModalProps> = ({ lecture, onClose }) => {
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const { showSuccess, showError } = useNotification();
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

  // Check if user has access to premium content
  const isPremium = lecture?.isPremium ?? false;
  const hasAccess = !isPremium || session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  // Share lecture URL
  const handleShare = async () => {
    const { success } = await shareItem("lecture", lecture?.id || "");
    if (success) {
      showSuccess(t("lectureDetail.linkCopied"));
    } else {
      showError(t("lectureDetail.copyError"));
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isTheaterMode) {
          setIsTheaterMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, isTheaterMode]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (lecture) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [lecture]);

  if (!lecture) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isTheaterMode
              ? "w-[95vw] h-[95vh]"
              : "w-full max-w-5xl max-h-[90vh] mx-4"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gray-900/80 border-b border-gray-800">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {lecture.title}
              </h2>
              <div className="flex items-center gap-3 sm:gap-4 mt-1.5 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{lecture.duration} {t("lecturesPage.minutes")}</span>
                </div>
                {lecture.date && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>{formatDate(lecture.date, locale)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={t("common.share")}
                title={t("common.share")}
              >
                <Share2 className="w-5 h-5 text-gray-300" />
              </button>
              {/* Favorite Button */}
              <FavoriteButton
                itemId={lecture.id}
                itemType="LECTURE"
                size="md"
                className="!w-10 !h-10 !rounded-full !bg-gray-800 hover:!bg-gray-700"
              />
              {/* Theater Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="hidden sm:flex w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 items-center justify-center transition-colors cursor-pointer"
                aria-label={isTheaterMode ? "Exit theater mode" : "Theater mode"}
                title={isTheaterMode ? "יציאה ממצב תיאטרון" : "מצב תיאטרון"}
              >
                {isTheaterMode ? (
                  <Minimize2 className="w-5 h-5 text-gray-300" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-gray-300" />
                )}
              </button>
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer group"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-300 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Premium Gate or Video Content */}
          {hasAccess ? (
            <>
              <div className={`relative bg-black ${isTheaterMode ? "flex-1" : ""}`}>
                {lecture.videoUrl ? (
                  <div
                    className="relative w-full"
                    style={{ paddingTop: isTheaterMode ? "0" : "56.25%" }}
                  >
                    <iframe
                      src={lecture.videoUrl}
                      title={lecture.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className={isTheaterMode ? "w-full h-full" : "absolute inset-0 w-full h-full"}
                      style={isTheaterMode ? { height: "calc(95vh - 180px)" } : undefined}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-900">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-500">אין וידאו זמין</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              {!isTheaterMode && (
                <div className="border-t border-gray-800">
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-gray-300 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium">תיאור ההרצאה</span>
                    {showDescription ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {showDescription && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-6 pb-6 max-h-48 overflow-y-auto">
                          <RichContent content={lecture.description} className="text-gray-300 prose-invert" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : (
            /* Premium Gate - shown when user doesn't have access */
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-900">
              <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-800 rounded-full mb-5">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {t("premiumGate.title")}
                </h3>

                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {t("premiumTeaser.lectureDescription")}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {!session ? (
                    <>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                      >
                        {t("premiumGate.subscribeButton")}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 text-gray-400 px-5 py-2.5 rounded-lg hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        {t("premiumGate.loginButton")}
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      {t("premiumGate.upgradeButton")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-5">
                  {t("premiumTeaser.priceHint")}
                </p>
              </div>
            </div>
          )}

          {/* Keyboard Hint */}
          <div className="hidden sm:flex items-center justify-center gap-4 px-6 py-2 bg-gray-900/50 border-t border-gray-800 text-xs text-gray-500">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">ESC</kbd>
              {" "}{t("lectures.keyboardClose")}
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">F</kbd>
              {" "}{t("lectures.keyboardFullscreen")}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LectureModal;

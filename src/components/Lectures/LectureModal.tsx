"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Share2, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Lecture } from "@/types/Lectures/lectures";
import { useTranslation } from "@/contexts/Translation/translation.context";
import RichContent from "@/components/RichContent";

interface LectureModalProps {
  lecture: Lecture | null;
  onClose: () => void;
}

const LectureModal: React.FC<LectureModalProps> = ({ lecture, onClose }) => {
  const { t } = useTranslation();
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

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
                    <span>{lecture.date}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Video Player */}
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

          {/* Keyboard Hint */}
          <div className="hidden sm:flex items-center justify-center gap-4 px-6 py-2 bg-gray-900/50 border-t border-gray-800 text-xs text-gray-500">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">ESC</kbd>
              {" "}לסגירה
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">F</kbd>
              {" "}למסך מלא
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LectureModal;

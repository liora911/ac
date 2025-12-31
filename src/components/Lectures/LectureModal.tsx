"use client";

import React from "react";
import { X, Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Lecture } from "@/types/Lectures/lectures";

interface LectureModalProps {
  lecture: Lecture | null;
  onClose: () => void;
}

const LectureModal: React.FC<LectureModalProps> = ({ lecture, onClose }) => {
  if (!lecture) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 pr-12">
              {lecture.title}
            </h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>{lecture.duration} דקות</span>
              </div>
              {lecture.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>{lecture.date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Video */}
            {lecture.videoUrl && (
              <div className="bg-black">
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={lecture.videoUrl}
                    title={lecture.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="p-6">
              <div
                className="prose prose-gray max-w-none text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lecture.description }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LectureModal;

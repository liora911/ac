"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Lecture } from "@/types/Lectures/lectures";
import Modal from "@/components/Modal/Modal";
import { useNotification } from "@/contexts/NotificationContext";

interface LectureCardProps {
  lecture: Lecture;
  onLectureClick: (lecture: Lecture) => void;
  onDeleteLecture: (lectureId: string) => void;
}

const LectureCard: React.FC<LectureCardProps> = ({
  lecture,
  onLectureClick,
  onDeleteLecture,
}) => {
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [lectureUrl, setLectureUrl] = useState("");
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLectureUrl(`${window.location.origin}/lectures/${lecture.id}`);
    }
  }, [lecture.id]);

  const handleCopyLink = async () => {
    if (!lectureUrl) return;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(lectureUrl);
        showSuccess("הלינק להרצאה הועתק ללוח");
      } else {
        showError("לא ניתן להעתיק לינק בדפדפן זה");
      }
    } catch (error) {
      console.error("Failed to copy lecture URL", error);
      showError("אירעה שגיאה בהעתקת הלינק להרצאה");
    }
  };

  return (
    <div className="backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 hover:shadow-gray-500/20 hover:border-gray-500/30 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden group">
      {lecture.bannerImageUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={lecture.bannerImageUrl}
            alt={lecture.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
        </div>
      )}
      <div className="p-4 flex-grow">
        <h4 className="text-xl font-semibold text-gray-400 mb-2 group-hover:text-gray-500 transition-colors">
          {lecture.title}
        </h4>
        <p className="text-slate-400 text-sm mb-3 line-clamp-3">
          {lecture.description.replace(/<[^>]*>?/gm, "")}
        </p>
        <div className="flex justify-between items-center text-xs text-slate-400 mt-auto">
          <span>משך: {lecture.duration} דק'/min</span>
          {lecture.date && <span>תאריך: {lecture.date}</span>}
        </div>
      </div>
      <div className="p-4 border-t border-slate-700/50 flex justify-between items-center">
        <div className="ml-auto flex flex-row-reverse gap-2">
          <button
            onClick={() => onLectureClick(lecture)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm font-semibold cursor-pointer shadow-lg hover:shadow-gray-500/25"
          >
            צפה בהרצאה
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsShareOpen(true);
            }}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold cursor-pointer shadow-lg hover:shadow-slate-500/25 flex items-center gap-1"
          >
            <span>שתף</span>
            <span>🔗</span>
          </button>
        </div>
      </div>
      <Modal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title="שיתוף הרצאה"
        confirmText="סגור"
      >
        <div className="space-y-4 mt-2">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              העתק את הקישור להרצאה:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={lectureUrl}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                העתק לינק
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              שיתוף מהיר (בקרוב):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="px-3 py-1 text-xs rounded-md border border-gray-400 text-gray-500 bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 opacity-60 cursor-not-allowed"
              >
                WhatsApp · בקרוב
              </button>
              <button
                type="button"
                disabled
                className="px-3 py-1 text-xs rounded-md border border-gray-400 text-gray-500 bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 opacity-60 cursor-not-allowed"
              >
                Discord · בקרוב
              </button>
              <button
                type="button"
                disabled
                className="px-3 py-1 text-xs rounded-md border border-gray-400 text-gray-500 bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 opacity-60 cursor-not-allowed"
              >
                Telegram · בקרוב
              </button>
              <button
                type="button"
                disabled
                className="px-3 py-1 text-xs rounded-md border border-gray-400 text-gray-500 bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 opacity-60 cursor-not-allowed"
              >
                Email · בקרוב
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LectureCard;

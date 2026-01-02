"use client";

import React, { useEffect, useState } from "react";
import { Lecture } from "@/types/Lectures/lectures";
import Modal from "@/components/Modal/Modal";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Clock, Calendar, Share2, Play, Link2, Check, Mail } from "lucide-react";

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
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [lectureUrl, setLectureUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();

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
        setCopied(true);
        showSuccess("הלינק הועתק!");
        setTimeout(() => setCopied(false), 2000);
      } else {
        showError("לא ניתן להעתיק לינק בדפדפן זה");
      }
    } catch (error) {
      console.error("Failed to copy lecture URL", error);
      showError("אירעה שגיאה בהעתקת הלינק");
    }
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(lecture.title + " - " + lectureUrl)}`, "_blank");
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(lectureUrl)}&text=${encodeURIComponent(lecture.title)}`, "_blank");
  };

  const handleShareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(lecture.title)}&body=${encodeURIComponent(lectureUrl)}`, "_blank");
  };

  const handleShareDiscord = async () => {
    const discordText = `**${lecture.title}**\n${lectureUrl}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(discordText);
        showSuccess("הועתק! הדבק בדיסקורד");
      }
    } catch (error) {
      showError("אירעה שגיאה בהעתקה");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden group">
      {lecture.bannerImageUrl && (
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={lecture.bannerImageUrl}
            alt={lecture.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5 flex-grow">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {lecture.title}
        </h4>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {lecture.description.replace(/<[^>]*>?/gm, "")}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>{lecture.duration} {t("lecturesPage.minutes")}</span>
          </div>
          {lecture.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{lecture.date}</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsShareOpen(true);
          }}
          className="w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
          aria-label="שתף"
        >
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => onLectureClick(lecture)}
          className="w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md hover:shadow-lg cursor-pointer"
          aria-label="צפה בהרצאה"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>

      <Modal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title="שיתוף הרצאה"
        hideFooter
      >
        <div className="space-y-4">
          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קישור להרצאה
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={lectureUrl}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 min-w-0"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    העתק
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              שיתוף מהיר
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="font-medium text-sm">WhatsApp</span>
              </button>
              {/* Telegram */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="font-medium text-sm">Telegram</span>
              </button>
              {/* Discord */}
              <button
                type="button"
                onClick={handleShareDiscord}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="font-medium text-sm">Discord</span>
              </button>
              {/* Email */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white transition-colors cursor-pointer"
              >
                <Mail className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">Email</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LectureCard;

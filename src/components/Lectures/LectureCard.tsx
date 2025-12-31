"use client";

import React, { useEffect, useState } from "react";
import { Lecture } from "@/types/Lectures/lectures";
import Modal from "@/components/Modal/Modal";
import { useNotification } from "@/contexts/NotificationContext";
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
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => onLectureClick(lecture)}
          className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          צפה בהרצאה
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsShareOpen(true);
          }}
          className="w-11 h-11 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
          aria-label="שתף"
        >
          <Share2 className="w-4 h-4 text-gray-600" />
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={lectureUrl}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="font-medium">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleShareTelegram}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="font-medium">Telegram</span>
              </button>
              <button
                type="button"
                onClick={handleShareEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Email</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LectureCard;

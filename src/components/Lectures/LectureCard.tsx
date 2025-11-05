"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lecture } from "@/types/Lectures/lectures";
import { ALLOWED_EMAILS } from "@/constants/auth";

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
  const { data: session } = useSession();
  const router = useRouter();

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const isAuthor = lecture.author?.email === session?.user?.email;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden group">
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
        <h4 className="text-xl font-semibold text-cyan-300 mb-2 group-hover:text-cyan-200 transition-colors">
          {lecture.title}
        </h4>
        <p className="text-slate-300 text-sm mb-3 line-clamp-3">
          {lecture.description.replace(/<[^>]*>?/gm, "")}
        </p>
        <div className="flex justify-between items-center text-xs text-slate-400 mt-auto">
          <span>משך: {lecture.duration}</span>
          {lecture.date && <span>תאריך: {lecture.date}</span>}
        </div>
      </div>
      <div className="p-4 border-t border-slate-700/50 flex justify-between items-center">
        <button
          onClick={() => onLectureClick(lecture)}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-500 transition-colors text-sm font-semibold cursor-pointer shadow-lg hover:shadow-cyan-500/25"
        >
          צפה בהרצאה
        </button>
        {isAuthorized && isAuthor && (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/edit-lecture/${lecture.id}`);
              }}
              className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-500 transition-colors text-sm cursor-pointer"
            >
              ✏️ ערוך
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLecture(lecture.id);
              }}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-500 transition-colors text-sm cursor-pointer"
            >
              🗑️ מחק
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureCard;

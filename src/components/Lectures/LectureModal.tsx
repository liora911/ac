"use client";

import React from "react";
import { Lecture } from "@/types/Lectures/lectures";

interface LectureModalProps {
  lecture: Lecture | null;
  onClose: () => void;
}

const LectureModal: React.FC<LectureModalProps> = ({ lecture, onClose }) => {
  if (!lecture) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-md rounded-xl shadow-2xl border border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-gray-300 text-2xl font-bold cursor-pointer transition-colors"
        >
          &times;
        </button>
        <h3 className="text-3xl font-bold text-gray-300 mb-4">
          {lecture.title}
        </h3>
        {lecture.videoUrl && (
          <div className="aspect-w-16 aspect-h-9 mb-4">
            <iframe
              src={lecture.videoUrl}
              title={lecture.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg w-full h-full shadow-lg"
            ></iframe>
          </div>
        )}
        <div
          className="text-slate-300 prose prose-invert prose-sm max-w-none mb-4"
          dangerouslySetInnerHTML={{
            __html: lecture.description,
          }}
        />
        <div className="flex justify-between items-center text-sm text-slate-400 border-t border-slate-700/50 pt-4">
          <span>משך: {lecture.duration}</span>
          {lecture.date && <span>תאריך: {lecture.date}</span>}
        </div>
      </div>
    </div>
  );
};

export default LectureModal;

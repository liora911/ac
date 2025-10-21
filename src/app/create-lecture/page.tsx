"use client";

import CreateLectureForm from "@/components/CreateLecture/create_lecture";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function CreateLecturePage() {
  const { t, locale } = useTranslation();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          {t("createLecturePage.title")}
        </h1>
        <CreateLectureForm />
      </div>
    </div>
  );
}

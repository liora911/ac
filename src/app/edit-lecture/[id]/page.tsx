"use client";

import React from "react";
import EditLectureForm from "@/components/EditLecture/edit_lecture";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function EditLecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = useTranslation();
  const [lectureId, setLectureId] = React.useState<string>("");

  React.useEffect(() => {
    params.then((p) => setLectureId(p.id));
  }, [params]);

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-5xl">
        {lectureId && <EditLectureForm lectureId={lectureId} />}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import EditLectureForm from "@/components/EditLecture/edit_lecture";

export default function EditLecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [lectureId, setLectureId] = React.useState<string>("");

  React.useEffect(() => {
    params.then((p) => setLectureId(p.id));
  }, [params]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          עריכת הרצאה
        </h1>
        {lectureId && <EditLectureForm lectureId={lectureId} />}
      </div>
    </div>
  );
}

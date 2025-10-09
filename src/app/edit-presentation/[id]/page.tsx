"use client";

import React from "react";
import EditPresentationForm from "@/components/EditPresentation/edit_presentation";

export default function EditPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [presentationId, setPresentationId] = React.useState<string>("");

  React.useEffect(() => {
    params.then((p) => setPresentationId(p.id));
  }, [params]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          עריכת מצגת
        </h1>
        {presentationId && (
          <EditPresentationForm presentationId={presentationId} />
        )}
      </div>
    </div>
  );
}

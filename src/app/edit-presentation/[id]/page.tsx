"use client";

import React from "react";
import EditPresentationForm from "@/components/EditPresentation/edit_presentation";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function EditPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [presentationId, setPresentationId] = React.useState<string>("");
  const { t, locale } = useTranslation();

  React.useEffect(() => {
    params.then((p) => setPresentationId(p.id));
  }, [params]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">
          {t("editPresentationPage.title")}
        </h1>
        {presentationId && (
          <EditPresentationForm presentationId={presentationId} />
        )}
      </div>
    </div>
  );
}

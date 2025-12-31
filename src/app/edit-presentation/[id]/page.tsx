"use client";

import React from "react";
import EditPresentationForm from "@/components/EditPresentation/edit_presentation";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function EditPresentationPage({ params }: any) {
  const { t, locale } = useTranslation();
  const presentationId = params?.id as string;

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        <EditPresentationForm presentationId={presentationId} />
      </div>
    </div>
  );
}

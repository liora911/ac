"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CreatePresentationForm from "@/components/CreatePresentation/create_presentation";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function CreatePresentationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, locale } = useTranslation();

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const handleSuccess = () => {
    router.push("/presentations");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              {t("createPresentation.notAuthorizedTitle")}
            </h2>
            <p className="text-gray-600">
              {t("createPresentation.notAuthorizedMessage")}
            </p>
            <p className="text-sm text-gray-500 mt-2">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 py-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("createPresentation.title")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("presentationsPage.title")}
          </p>
        </div>
        <CreatePresentationForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

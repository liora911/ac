"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategories } from "@/hooks/useArticles";
import { useCreateLecture } from "@/hooks/useLectures";
import { LectureForm, initialLectureFormData } from "@/components/LectureForm";
import type { LectureFormData } from "@/components/LectureForm";

interface CreateLectureFormProps {
  onSuccess?: () => void;
}

export default function CreateLectureForm({ onSuccess }: CreateLectureFormProps) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createLectureMutation = useCreateLecture();

  const [formData, setFormData] = useState<LectureFormData>(initialLectureFormData);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Loading state
  if (status === "loading" || categoriesLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {status === "loading" ? t("createLecture.loading") : t("createLecture.loadingCategories")}
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("createLecture.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">{t("createLecture.loginRequiredMessage")}</p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("createLecture.loginButton")}
        </button>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("createLecture.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">{t("createLecture.notAuthorizedMessage")}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{session?.user?.email}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate required fields
    const isTab1Complete =
      formData.title.trim() !== "" &&
      formData.categoryId !== "" &&
      formData.duration.trim() !== "";

    if (!isTab1Complete) {
      setMessage({
        type: "error",
        text: t("createLecture.requiredFieldsError") || "Please fill in all required fields",
      });
      return;
    }

    try {
      await createLectureMutation.mutateAsync(formData);
      setMessage({ type: "success", text: t("createLecture.successMessage") });
      setFormData(initialLectureFormData);
      onSuccess?.();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("createLecture.errorMessage"),
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white rtl">
          {t("createLecture.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("createLecture.loggedInAs")} {session?.user?.email}
        </p>
      </div>

      <LectureForm
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isSubmitting={createLectureMutation.isPending}
        translationPrefix="createLecture"
        submitLabel={t("createLecture.submit")}
        submitLoadingLabel={t("createLecture.submitCreating")}
        message={message}
        onError={(msg) => setMessage({ type: "error", text: msg })}
      />
    </>
  );
}

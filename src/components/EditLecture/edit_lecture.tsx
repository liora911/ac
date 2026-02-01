"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategories } from "@/hooks/useArticles";
import { useLecture, useUpdateLecture } from "@/hooks/useLectures";
import { LectureForm, initialLectureFormData } from "@/components/LectureForm";
import type { LectureFormData } from "@/components/LectureForm";

interface EditLectureFormProps {
  lectureId: string;
  onSuccess?: () => void;
}

export default function EditLectureForm({ lectureId, onSuccess }: EditLectureFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: lecture, isLoading: lectureLoading, error: lectureError } = useLecture(lectureId);
  const updateLectureMutation = useUpdateLecture();

  const [formData, setFormData] = useState<LectureFormData>(initialLectureFormData);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Initialize form data when lecture is loaded
  useEffect(() => {
    if (lecture && !isInitialized) {
      setFormData({
        title: lecture.title || "",
        description: lecture.description || "",
        videoUrl: lecture.videoUrl || "",
        duration: lecture.duration || "",
        date: lecture.date || "",
        bannerImageUrl: lecture.bannerImageUrl || "",
        categoryId: lecture.category?.id || "",
        isPremium: lecture.isPremium || false,
      });
      setIsInitialized(true);
    }
  }, [lecture, isInitialized]);

  // Loading state
  if (status === "loading" || lectureLoading || categoriesLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {status === "loading"
              ? t("editLectureForm.loadingGeneric")
              : t("editLectureForm.loadingLectureData")}
          </p>
        </div>
      </div>
    );
  }

  // Lecture load error
  if (lectureError) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editLectureForm.loadError")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{lectureError.message}</p>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editLectureForm.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editLectureForm.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("editLectureForm.loginButton")}
        </button>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editLectureForm.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editLectureForm.notAuthorizedMessage")}
        </p>
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
        text: t("editLectureForm.requiredFieldsError") || "Please fill in all required fields",
      });
      return;
    }

    try {
      await updateLectureMutation.mutateAsync({
        id: lectureId,
        ...formData,
      });
      setMessage({ type: "success", text: t("editLectureForm.updateSuccess") });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/lectures/${lectureId}`);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("editLectureForm.updateError"),
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white rtl">
          {t("editLectureForm.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("editLectureForm.loggedInAs")} {session?.user?.email}
        </p>
      </div>

      <LectureForm
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isSubmitting={updateLectureMutation.isPending}
        translationPrefix="editLectureForm"
        submitLabel={t("editLectureForm.submit")}
        submitLoadingLabel={t("editLectureForm.submitUpdating")}
        message={message}
        onError={(msg) => setMessage({ type: "error", text: msg })}
      />
    </>
  );
}

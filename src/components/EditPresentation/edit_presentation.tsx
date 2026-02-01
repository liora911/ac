"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategories } from "@/hooks/useArticles";
import { usePresentation, useUpdatePresentation } from "@/hooks/usePresentations";
import { PresentationForm, initialPresentationFormData } from "@/components/PresentationForm";
import type { PresentationFormData } from "@/components/PresentationForm";

interface EditPresentationFormProps {
  presentationId: string;
  onSuccess?: () => void;
}

export default function EditPresentationForm({ presentationId, onSuccess }: EditPresentationFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: presentation, isLoading: presentationLoading, error: presentationError } = usePresentation(presentationId);
  const updatePresentationMutation = useUpdatePresentation();

  const [formData, setFormData] = useState<PresentationFormData>(initialPresentationFormData);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Initialize form data when presentation is loaded
  useEffect(() => {
    if (presentation && !isInitialized) {
      setFormData({
        title: presentation.title || "",
        description: presentation.description || "",
        content: presentation.content || "",
        googleSlidesUrl: presentation.googleSlidesUrl || "",
        pdfUrl: presentation.pdfUrl || null,
        imageUrls: presentation.imageUrls || [],
        categoryId: presentation.category?.id || "",
        isPremium: presentation.isPremium || false,
      });
      setIsInitialized(true);
    }
  }, [presentation, isInitialized]);

  // Loading state
  if (status === "loading" || presentationLoading || categoriesLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {status === "loading"
              ? t("editPresentationForm.loadingGeneric")
              : t("editPresentationForm.loadingPresentationData")}
          </p>
        </div>
      </div>
    );
  }

  // Presentation load error
  if (presentationError) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editPresentationForm.loadError")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{presentationError.message}</p>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editPresentationForm.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editPresentationForm.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("editPresentationForm.loginButton")}
        </button>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editPresentationForm.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editPresentationForm.notAuthorizedMessage")}
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
      formData.categoryId !== "";

    if (!isTab1Complete) {
      setMessage({
        type: "error",
        text: t("editPresentationForm.requiredFieldsError") || "Please fill in all required fields",
      });
      return;
    }

    try {
      const submissionData = {
        id: presentationId,
        ...formData,
        imageUrls: formData.imageUrls.filter((url) => url.trim() !== ""),
      };

      await updatePresentationMutation.mutateAsync(submissionData);
      setMessage({ type: "success", text: t("editPresentationForm.updateSuccess") });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/presentations/${presentationId}`);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("editPresentationForm.updateError"),
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white rtl">
          {t("editPresentationForm.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("editPresentationForm.loggedInAs")} {session?.user?.email}
        </p>
      </div>

      <PresentationForm
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isSubmitting={updatePresentationMutation.isPending}
        translationPrefix="editPresentationForm"
        submitLabel={t("editPresentationForm.submit")}
        submitLoadingLabel={t("editPresentationForm.submitUpdating")}
        message={message}
        onError={(msg) => setMessage({ type: "error", text: msg })}
      />
    </>
  );
}

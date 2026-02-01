"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useCategories } from "@/hooks/useArticles";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import { EventForm, initialEventFormData } from "@/components/EventForm";
import type { EventFormData } from "@/components/EventForm";

interface EditEventFormProps {
  eventId: string;
  onSuccess?: () => void;
}

export default function EditEventForm({ eventId, onSuccess }: EditEventFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const updateEventMutation = useUpdateEvent();

  const [formData, setFormData] = useState<EventFormData>(initialEventFormData);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Initialize form data when event is loaded
  useEffect(() => {
    if (event && !isInitialized) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        eventType: event.eventType || "",
        location: event.location || "",
        onlineUrl: event.onlineUrl || "",
        eventDate: event.eventDate
          ? new Date(event.eventDate).toISOString().split("T")[0]
          : "",
        eventTime: event.eventTime || "",
        bannerImageUrl: event.bannerImageUrl || "",
        categoryId: event.categoryId || "",
        maxSeats: event.maxSeats ? String(event.maxSeats) : "",
        isFeatured: event.isFeatured || false,
        isClosed: event.isClosed || false,
        requiresRegistration: event.requiresRegistration !== false,
        price: event.price ? String(event.price / 100) : "",
      });
      setIsInitialized(true);
    }
  }, [event, isInitialized]);

  // Loading state
  if (status === "loading" || eventLoading || categoriesLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {status === "loading"
              ? t("editEventForm.loadingGeneric")
              : t("editEventForm.loadingEventData")}
          </p>
        </div>
      </div>
    );
  }

  // Event load error
  if (eventError) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editEventForm.loadError")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{eventError.message}</p>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editEventForm.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editEventForm.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("editEventForm.loginButton")}
        </button>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editEventForm.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editEventForm.notAuthorizedMessage")}
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
      formData.eventType !== "" &&
      formData.categoryId !== "" &&
      formData.eventDate !== "";

    if (!isTab1Complete) {
      setMessage({
        type: "error",
        text: t("editEventForm.requiredFieldsError") || "Please fill in all required fields",
      });
      return;
    }

    try {
      const submissionData = {
        id: eventId,
        ...formData,
        maxSeats: formData.maxSeats ? parseInt(formData.maxSeats) : null,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : null,
      };

      await updateEventMutation.mutateAsync(submissionData);
      setMessage({ type: "success", text: t("editEventForm.updateSuccess") });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/events");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("editEventForm.updateError"),
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white rtl">
          {t("editEventForm.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("editEventForm.loggedInAs")} {session?.user?.email}
        </p>
      </div>

      <EventForm
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        categoriesLoading={categoriesLoading}
        isSubmitting={updateEventMutation.isPending}
        translationPrefix="editEventForm"
        submitLabel={t("editEventForm.submit")}
        submitLoadingLabel={t("editEventForm.submitUpdating")}
        message={message}
      />
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useHomeContent, useUpdateHomeContent } from "@/hooks/useHomeContent";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/TranslationContext";
import TiptapEditor from "@/lib/editor/editor";
import LoginForm from "@/components/Login/login";

export default function HomeAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  const { showSuccess, showError } = useNotification();

  const { data, isLoading, error } = useHomeContent();
  const updateMutation = useUpdateHomeContent();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [photoCredit, setPhotoCredit] = useState<string>("");
  const [bioHtml, setBioHtml] = useState<string>("");
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");

  useEffect(() => {
    if (data) {
      setImageUrl(data.imageUrl ?? "");
      setPhotoCredit(data.photoCredit ?? "");
      setBioHtml(data.bioHtml ?? "");
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        imageUrl: imageUrl.trim() || null,
        photoCredit: photoCredit.trim() || null,
        bioHtml: bioHtml || "",
      },
      {
        onSuccess: () => {
          showSuccess(t("admin.home.updateSuccess"));
        },
        onError: (err: any) => {
          showError(
            err?.message || t("admin.home.updateError")
          );
        },
      }
    );
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">{t("admin.home.unauthorized")}</p>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("admin.home.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("admin.home.description")}
          </p>
        </div>
        {data?.updatedAt && (
          <p className="text-xs text-gray-500">
            {t("admin.home.lastUpdated")}{" "}
            {new Date(data.updatedAt).toLocaleString("he-IL", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {t("admin.home.loadError")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("admin.home.imageAndCredit")}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="home-image-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("admin.home.imageUrl")}
              </label>
              <input
                id="home-image-url"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder=":https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="home-photo-credit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("admin.home.photoCredit")}
              </label>
              <input
                id="home-photo-credit"
                type="text"
                value={photoCredit}
                onChange={(e) => setPhotoCredit(e.target.value)}
                placeholder={t("admin.home.photoCreditPlaceholder")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {imageUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t("admin.home.preview")}
                </p>
                <div className="border border-dashed border-gray-300 rounded-md p-3 flex justify-center">
                  <img
                    src={imageUrl}
                    alt="תצוגה מקדימה של תמונת דף הבית"
                    className="max-h-48 rounded-md object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("admin.home.biography")}</h3>
          <TiptapEditor
            value={bioHtml}
            onChange={setBioHtml}
            placeholder={t("admin.home.biographyPlaceholder")}
            direction={direction}
            onDirectionChange={(dir) => setDirection(dir)}
            theme="light"
            className="mt-3"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            <p>{t("admin.home.saveNote")}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || updateMutation.isPending}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? t("admin.home.saving") : t("admin.home.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

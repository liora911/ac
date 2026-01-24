"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import TiptapEditor from "@/lib/editor/editor";
import DragDropImageUpload from "@/components/Upload/upload";
import LoginForm from "@/components/Login/login";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface AboutPageData {
  id: string;
  titleEn: string;
  titleHe: string;
  contentEn: string | null;
  contentHe: string | null;
  imageUrl: string | null;
  published: boolean;
  updatedAt: string;
}

export default function AboutAdmin() {
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AboutPageData | null>(null);

  const [titleEn, setTitleEn] = useState("About");
  const [titleHe, setTitleHe] = useState("אודות");
  const [contentEn, setContentEn] = useState("");
  const [contentHe, setContentHe] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/about");
        if (res.ok) {
          const aboutData = await res.json();
          setData(aboutData);
          setTitleEn(aboutData.titleEn || "About");
          setTitleHe(aboutData.titleHe || "אודות");
          setContentEn(aboutData.contentEn || "");
          setContentHe(aboutData.contentHe || "");
          setImageUrl(aboutData.imageUrl || "");
          setPublished(aboutData.published || false);
        }
      } catch (error) {
        console.error("Error fetching about page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn,
          titleHe,
          contentEn,
          contentHe,
          imageUrl: imageUrl || null,
          published,
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setData(updatedData);
        showSuccess(t("about.saveSuccess"));
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      showError(t("about.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">{t("admin.home.unauthorized")}</p>
        <LoginForm />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t("about.editTitle")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("about.notAvailable") ? "" : "Manage the About page content"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {published && (
            <Link
              href="/about"
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {locale === "he" ? "צפה בעמוד" : "View Page"}
            </Link>
          )}
          {data?.updatedAt && (
            <p className="text-xs text-gray-500">
              {locale === "he" ? "עודכן לאחרונה:" : "Last updated:"}{" "}
              {new Date(data.updatedAt).toLocaleString(locale === "he" ? "he-IL" : "en-US", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Published Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("about.publishedLabel")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("about.publishedDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              published ? "bg-green-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                published ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          {published ? (
            <>
              <Eye className="w-4 h-4 text-green-500" />
              <span className="text-green-600">{locale === "he" ? "העמוד גלוי" : "Page is visible"}</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{locale === "he" ? "העמוד מוסתר" : "Page is hidden"}</span>
            </>
          )}
        </div>
      </div>

      {/* Titles */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {locale === "he" ? "כותרות" : "Titles"}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("about.titleEnLabel")}
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("about.titleHeLabel")}
            </label>
            <input
              type="text"
              value={titleHe}
              onChange={(e) => setTitleHe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("about.imageLabel")}
        </h3>
        <DragDropImageUpload
          onImageSelect={(url) => setImageUrl(url || "")}
          currentImage={imageUrl || undefined}
          placeholder="PNG, JPG, GIF, WebP (max 5MB)"
          onError={(msg) => showError(msg)}
        />
      </div>

      {/* Content Editors */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("about.contentEnLabel")}
        </h3>
        <TiptapEditor
          value={contentEn}
          onChange={setContentEn}
          placeholder="Write the English content here..."
          direction="ltr"
          theme="light"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("about.contentHeLabel")}
        </h3>
        <TiptapEditor
          value={contentHe}
          onChange={setContentHe}
          placeholder="כתוב את התוכן בעברית כאן..."
          direction="rtl"
          theme="light"
        />
      </div>

      {/* Save Button */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            <p>{locale === "he" ? "לחץ על שמור כדי לעדכן את עמוד האודות" : "Click save to update the About page"}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {locale === "he" ? "שומר..." : "Saving..."}
              </>
            ) : (
              locale === "he" ? "שמור שינויים" : "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

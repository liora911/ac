"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { SiteSettings } from "@/types/SiteSettings/settings";
import { Globe, Mail, Phone, Save, Loader2 } from "lucide-react";
import { FaFacebook, FaYoutube } from "react-icons/fa";

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Avshalom Elitzur",
  siteDescription: "",
  contactEmail: "",
  contactPhone: "",
  facebookUrl: "",
  youtubeUrl: "",
  defaultLanguage: "he",
};

export default function SettingsAdmin() {
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/site-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "ההגדרות נשמרו בהצלחה!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "שמירת ההגדרות נכשלה. נסה שנית.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p>יש להתחבר עם חשבון מורשה כדי לנהל הגדרות.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            הגדרות מערכת
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            הגדר את פרטי האתר וקישורים לרשתות חברתיות.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              פרטי האתר
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="siteTitle"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                שם האתר
              </label>
              <input
                id="siteTitle"
                type="text"
                value={settings.siteTitle}
                onChange={(e) => handleInputChange("siteTitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הזן שם אתר"
              />
            </div>

            <div>
              <label
                htmlFor="siteDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                תיאור האתר
              </label>
              <textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) =>
                  handleInputChange("siteDescription", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="הזן תיאור קצר לאתר (SEO)"
              />
            </div>

            <div>
              <label
                htmlFor="defaultLanguage"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                שפת ברירת מחדל
              </label>
              <select
                id="defaultLanguage"
                value={settings.defaultLanguage}
                onChange={(e) =>
                  handleInputChange("defaultLanguage", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              פרטי התקשרות
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  דוא״ל ליצירת קשר
                </span>
              </label>
              <input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  handleInputChange("contactEmail", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@example.com"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  טלפון ליצירת קשר
                </span>
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone}
                onChange={(e) =>
                  handleInputChange("contactPhone", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+972-50-123-4567"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaFacebook className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              רשתות חברתיות
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="facebookUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="flex items-center gap-1.5">
                  <FaFacebook className="w-4 h-4 text-blue-600" />
                  קישור לפייסבוק
                </span>
              </label>
              <input
                id="facebookUrl"
                type="url"
                value={settings.facebookUrl}
                onChange={(e) =>
                  handleInputChange("facebookUrl", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="youtubeUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span className="flex items-center gap-1.5">
                  <FaYoutube className="w-4 h-4 text-red-600" />
                  קישור ליוטיוב
                </span>
              </label>
              <input
                id="youtubeUrl"
                type="url"
                value={settings.youtubeUrl}
                onChange={(e) =>
                  handleInputChange("youtubeUrl", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://youtube.com/..."
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            שמירה
          </h3>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                שמור הגדרות
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            ההגדרות נשמרות במסד הנתונים.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";

interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
}

export default function SettingsAdmin() {
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  const [settings, setSettings] = useState<SiteSettings>({
    siteTitle: "Elitzur Vaidman",
    siteDescription: "Academic website for Professor Avshalom Elitzur",
    contactEmail: "contact@elitzur-vaidman.com",
    contactPhone: "",
    maintenanceMode: false,
    allowRegistration: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem("siteSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }
  }, []);

  const handleInputChange = (
    field: keyof SiteSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      localStorage.setItem("siteSettings", JSON.stringify(settings));

      setMessage({ type: "success", text: "Settings saved successfully!" });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">
          You must sign in with an authorized account to manage settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Site Settings
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure general site settings and preferences.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="siteTitle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Site Title
              </label>
              <input
                id="siteTitle"
                type="text"
                value={settings.siteTitle}
                onChange={(e) => handleInputChange("siteTitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter site title"
              />
            </div>

            <div>
              <label
                htmlFor="siteDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Site Description
              </label>
              <textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) =>
                  handleInputChange("siteDescription", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter site description"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contact Email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  handleInputChange("contactEmail", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contact Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone}
                onChange={(e) =>
                  handleInputChange("contactPhone", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="maintenanceMode"
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  handleInputChange("maintenanceMode", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="maintenanceMode"
                className="ml-2 block text-sm text-gray-900"
              >
                Maintenance Mode
              </label>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, the site will show a maintenance page to visitors.
            </p>

            <div className="flex items-center">
              <input
                id="allowRegistration"
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) =>
                  handleInputChange("allowRegistration", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="allowRegistration"
                className="ml-2 block text-sm text-gray-900"
              >
                Allow User Registration
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Enable public user registration (currently not implemented).
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Changes are saved locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

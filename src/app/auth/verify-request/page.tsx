"use client";

import { Mail, ArrowLeft } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            בדוק את המייל שלך
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            שלחנו לך קישור התחברות חד-פעמי.
            <br />
            לחץ על הקישור במייל כדי להמשיך.
          </p>

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700 mb-6">
            <p className="font-medium mb-1">שים לב:</p>
            <ul className="text-right list-disc list-inside space-y-1">
              <li>הקישור תקף למספר דקות בלבד</li>
              <li>בדוק גם בתיקיית הספאם</li>
              <li>אל תשתף את הקישור עם אף אחד</li>
            </ul>
          </div>

          {/* Back link */}
          <a
            href="/auth/admin-login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            חזור לדף ההתחברות
          </a>
        </div>
      </div>
    </div>
  );
}

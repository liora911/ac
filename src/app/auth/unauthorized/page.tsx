"use client";

import { signOut } from "next-auth/react";
import { ShieldX, Home, LogOut } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            אין לך הרשאת גישה
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            המשתמש שלך אינו מורשה לגשת לפאנל הניהול.
            <br />
            אם אתה צריך גישה, אנא פנה למנהל המערכת.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              חזור לדף הבית
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק ונסה עם משתמש אחר
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

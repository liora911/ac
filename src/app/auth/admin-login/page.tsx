"use client";

import { Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Shield, Mail, ArrowRight } from "lucide-react";
import { ALLOWED_EMAILS } from "@/constants/auth";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;

function AdminLoginContent() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();

  const callbackUrl = searchParams.get("callbackUrl") || "/elitzur";

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      setNotice({
        kind: "error",
        text: t("auth.unauthorized"),
      });
    }
  }, [searchParams, t]);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setNotice(null);

    // Check if email is in allowed list BEFORE sending magic link
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setNotice({
        kind: "error",
        text: t("auth.unauthorized"),
      });
      showError(t("auth.unauthorized"));
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setNotice({
            kind: "error",
            text: t("auth.unauthorized"),
          });
          showError(t("auth.unauthorized"));
        } else {
          setNotice({
            kind: "error",
            text: t("auth.emailError"),
          });
          showError(t("auth.emailError"));
        }
      } else {
        setNotice({
          kind: "success",
          text: t("auth.linkSent"),
        });
        showSuccess(t("auth.linkSent"));
      }
    } catch {
      setNotice({
        kind: "error",
        text: t("auth.errorTryAgain"),
      });
      showError(t("auth.errorTryAgain"));
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <LoginSkeleton />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("auth.adminPanel")}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {t("auth.adminOnly")}
            </p>
          </div>

          {/* Notice */}
          {notice && (
            <div
              role="alert"
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                notice.kind === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : notice.kind === "info"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-white pr-10 pl-4 py-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("auth.sendingLink")}
                </>
              ) : (
                <>
                  {t("auth.sendLoginLink")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              {t("auth.adminLoginInfo")}
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t("auth.backHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 mx-auto rounded-full bg-gray-200" />
            <div className="h-6 w-40 mx-auto rounded bg-gray-200" />
            <div className="h-4 w-60 mx-auto rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <AdminLoginContent />
    </Suspense>
  );
}

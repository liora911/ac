"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import type { Notice } from "@/types/Auth/auth";

export default function LoginForm() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const { t } = useTranslation();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      setNotice({
        kind: "error",
        text: t("auth.unauthorized"),
      });
    }
  }, [searchParams, t]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setNotice(null);

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
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
    return (
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          <div className="mt-3 h-10 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("auth.welcome")}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("auth.userLoggedIn")}{" "}
            <strong className="font-semibold text-gray-900 dark:text-white">
              {session.user?.email}
            </strong>
          </p>
          <button
            onClick={async () => {
              await signOut();
              showSuccess(t("auth.signOutSuccess"));
            }}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("auth.signIn")}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("auth.emailLinkInfo")}
        </p>

        {notice && (
          <div
            role="alert"
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              notice.kind === "success"
                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : notice.kind === "info"
                ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {notice.text}
          </div>
        )}

        <form
          onSubmit={handleEmailSignIn}
          className="mt-5 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              {t("auth.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              aria-required="true"
              aria-describedby="email-error email-help"
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div id="email-help" className="sr-only">
              Enter your email address to receive a magic login link
            </div>
            <div id="email-error" className="sr-only" aria-live="polite"></div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby={isLoading ? "loading-status" : undefined}
          >
            {isLoading ? t("auth.sending") : t("auth.sendEmailLink")}
          </button>
          <div id="loading-status" className="sr-only" aria-live="polite">
            {isLoading ? "Sending login link to your email" : ""}
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>{t("auth.noPasswordInfo")}</p>
        </div>
      </div>
    </div>
  );
}

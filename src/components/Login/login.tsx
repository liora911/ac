"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";

type Notice = { kind: "success" | "error" | "info"; text: string } | null;

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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-10 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">{t("auth.welcome")}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("auth.userLoggedIn")}{" "}
            <strong className="font-semibold text-gray-900">
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">{t("auth.signIn")}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t("auth.emailLinkInfo")}
        </p>

        {notice && (
          <div
            role="alert"
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
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

        <form
          onSubmit={handleEmailSignIn}
          className="mt-5 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-700"
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
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>{t("auth.noPasswordInfo")}</p>
        </div>
      </div>
    </div>
  );
}

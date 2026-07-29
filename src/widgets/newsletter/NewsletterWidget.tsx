"use client";

import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useSubscribeNewsletter } from "@/hooks/useNewsletter";

function useSubscribeForm() {
  const subscribe = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate(email.trim(), { onSuccess: () => setEmail("") });
  };
  return { subscribe, email, setEmail, onSubmit };
}

export function NewsletterCard() {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const { subscribe, email, setEmail, onSubmit } = useSubscribeForm();

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm text-center"
    >
      <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {t("newsletter.footerTitle")}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t("newsletter.footerDescription")}
      </p>
      {subscribe.isSuccess ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          {t("newsletter.success")}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            required
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={subscribe.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {subscribe.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t("newsletter.subscribe")
            )}
          </button>
        </form>
      )}
      {subscribe.isError && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400">
          {t("newsletter.error")}
        </p>
      )}
    </div>
  );
}

export function NewsletterCompact() {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const { subscribe, email, setEmail, onSubmit } = useSubscribeForm();

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="max-w-3xl mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4 flex flex-col sm:flex-row items-center gap-3"
    >
      <div className="flex items-center gap-2 flex-shrink-0 text-blue-700 dark:text-blue-300">
        <Mail className="w-5 h-5" />
        <span className="text-sm font-semibold">
          {t("newsletter.footerTitle")}
        </span>
      </div>
      {subscribe.isSuccess ? (
        <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 sm:ms-auto">
          <CheckCircle className="w-4 h-4" />
          {t("newsletter.success")}
        </span>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-1 w-full gap-2 sm:ms-auto sm:max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            required
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={subscribe.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
          >
            {subscribe.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t("newsletter.subscribe")
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export function NewsletterPreview() {
  return <NewsletterCompact />;
}

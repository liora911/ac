"use client";

import { useState } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNewsletterSubscribers, useRemoveSubscriber, useSendNewsletter } from "@/hooks/useNewsletter";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Trash2,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface ArticleOption {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
}

export default function NewsletterAdmin() {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const { data: subscribersData, isLoading: subscribersLoading } = useNewsletterSubscribers();
  const removeSubscriber = useRemoveSubscriber();
  const sendNewsletter = useSendNewsletter();

  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [subject, setSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  // Fetch published articles for the dropdown
  const { data: articles } = useQuery<ArticleOption[]>({
    queryKey: ["newsletter-articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles?published=true");
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      return (data.articles || data).map((a: any) => ({
        id: a.id,
        title: a.title,
        subtitle: a.subtitle,
        slug: a.slug,
      }));
    },
  });

  const selectedArticle = articles?.find((a) => a.id === selectedArticleId);

  const handleArticleSelect = (articleId: string) => {
    setSelectedArticleId(articleId);
    const article = articles?.find((a) => a.id === articleId);
    if (article) {
      setSubject(`מאמר חדש: ${article.title}`);
      setCustomMessage(`מאמר חדש העליתי {articleName} בבקשה תהנו`);
    }
  };

  const handleSend = async () => {
    if (!selectedArticleId || !subject || !customMessage) return;
    setShowConfirm(false);
    setSendResult(null);

    try {
      const result = await sendNewsletter.mutateAsync({
        articleId: selectedArticleId,
        subject,
        customMessage,
      });
      setSendResult({ sent: result.sent, failed: result.failed });
    } catch {
      // error handled by mutation
    }
  };

  const previewMessage = customMessage
    .replace(/\{articleName\}/g, selectedArticle?.title || "{articleName}")
    .replace(/\{articleSubtitle\}/g, selectedArticle?.subtitle || "{articleSubtitle}")
    .replace(/\{articleTitle\}/g, selectedArticle?.title || "{articleTitle}");

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("admin.newsletter.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("admin.newsletter.description")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Send Newsletter Section ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          {t("admin.newsletter.sendNewsletter")}
        </h3>

        <div className="space-y-4">
          {/* Article Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.newsletter.selectArticle")}
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => handleArticleSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("admin.newsletter.chooseArticle")}</option>
              {articles?.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.newsletter.subject")}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("admin.newsletter.subjectPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.newsletter.customMessage")}
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder={t("admin.newsletter.messagePlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {t("admin.newsletter.variablesHint")}:
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{"{articleName}"}</code>
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{"{articleSubtitle}"}</code>
              </span>
            </div>
          </div>

          {/* Preview */}
          {customMessage && selectedArticle && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {t("admin.newsletter.preview")}
              </p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {previewMessage}
              </p>
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedArticle.title}</p>
                {selectedArticle.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedArticle.subtitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Send Result */}
          {sendResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              sendResult.failed === 0
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            }`}>
              <CheckCircle className="w-4 h-4" />
              {t("admin.newsletter.sendSuccess")}: {sendResult.sent} {t("admin.newsletter.sent")}
              {sendResult.failed > 0 && `, ${sendResult.failed} ${t("admin.newsletter.failed")}`}
            </div>
          )}

          {sendNewsletter.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {t("admin.newsletter.sendError")}
            </div>
          )}

          {/* Send Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedArticleId || !subject || !customMessage || sendNewsletter.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {sendNewsletter.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t("admin.newsletter.sendToAll")}
              {subscribersData?.total ? ` (${subscribersData.total})` : ""}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("admin.newsletter.confirmTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("admin.newsletter.confirmMessage").replace("{count}", String(subscribersData?.total || 0))}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                {t("admin.newsletter.cancel")}
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {t("admin.newsletter.confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscribers List ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("admin.newsletter.subscribers")}
          {subscribersData?.total != null && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({subscribersData.total})
            </span>
          )}
        </h3>

        {subscribersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : !subscribersData?.subscribers.length ? (
          <div className="text-center py-8">
            <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("admin.newsletter.noSubscribers")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subscribersData.subscribers.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(sub.subscribedAt).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}
                  </p>
                </div>
                <button
                  onClick={() => removeSubscriber.mutate(sub.id)}
                  disabled={removeSubscriber.isPending}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  title={t("admin.newsletter.removeSubscriber")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

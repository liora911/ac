"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNewsletterSubscribers, useRemoveSubscriber, useSendNewsletter } from "@/hooks/useNewsletter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Trash2,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  FileEdit,
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
  const [templateSaved, setTemplateSaved] = useState(false);

  // Template fields
  const [tplSubjectHe, setTplSubjectHe] = useState("מאמר חדש: {articleName}");
  const [tplMessageHe, setTplMessageHe] = useState("מאמר חדש פורסם: {articleName}. מוזמנים לקרוא!");
  const [tplSubjectEn, setTplSubjectEn] = useState("New Article: {articleName}");
  const [tplMessageEn, setTplMessageEn] = useState("A new article has been published: {articleName}. Check it out!");

  const queryClient = useQueryClient();

  // Load saved template from site settings
  const { data: siteSettings } = useQuery<any>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.newsletterSubject) setTplSubjectHe(siteSettings.newsletterSubject);
      if (siteSettings.newsletterMessage) setTplMessageHe(siteSettings.newsletterMessage);
      if (siteSettings.newsletterSubjectEn) setTplSubjectEn(siteSettings.newsletterSubjectEn);
      if (siteSettings.newsletterMessageEn) setTplMessageEn(siteSettings.newsletterMessageEn);
    }
  }, [siteSettings]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsletterSubject: tplSubjectHe,
          newsletterMessage: tplMessageHe,
          newsletterSubjectEn: tplSubjectEn,
          newsletterMessageEn: tplMessageEn,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 3000);
    },
  });

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
              {t("newsletter.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("newsletter.description")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Send Newsletter Section ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          {t("newsletter.sendNewsletter")}
        </h3>

        <div className="space-y-4">
          {/* Article Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("newsletter.selectArticle")}
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => handleArticleSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("newsletter.chooseArticle")}</option>
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
              {t("newsletter.subject")}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("newsletter.subjectPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("newsletter.customMessage")}
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder={t("newsletter.messagePlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {t("newsletter.variablesHint")}:
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{"{articleName}"}</code>
                <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{"{articleSubtitle}"}</code>
              </span>
            </div>
          </div>

          {/* Preview */}
          {customMessage && selectedArticle && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {t("newsletter.preview")}
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
              {t("newsletter.sendSuccess")}: {sendResult.sent} {t("newsletter.sent")}
              {sendResult.failed > 0 && `, ${sendResult.failed} ${t("newsletter.failed")}`}
            </div>
          )}

          {sendNewsletter.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {t("newsletter.sendError")}
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
              {t("newsletter.sendToAll")}
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
              {t("newsletter.confirmTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("newsletter.confirmMessage").replace("{count}", String(subscribersData?.total || 0))}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                {t("newsletter.cancel")}
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {t("newsletter.confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscribers List ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("newsletter.subscribers")}
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
              {t("newsletter.noSubscribers")}
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
                  title={t("newsletter.removeSubscriber")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Auto-Send Template ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <FileEdit className="w-5 h-5" />
          {t("newsletter.templateTitle")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("newsletter.templateDescription")}
        </p>

        <div className="space-y-5">
          {/* Hebrew template */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">עברית</h4>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("newsletter.subject")}
              </label>
              <input
                type="text"
                value={tplSubjectHe}
                onChange={(e) => setTplSubjectHe(e.target.value)}
                dir="rtl"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("newsletter.customMessage")}
              </label>
              <textarea
                value={tplMessageHe}
                onChange={(e) => setTplMessageHe(e.target.value)}
                dir="rtl"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* English template */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">English</h4>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("newsletter.subject")}
              </label>
              <input
                type="text"
                value={tplSubjectEn}
                onChange={(e) => setTplSubjectEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("newsletter.customMessage")}
              </label>
              <textarea
                value={tplMessageEn}
                onChange={(e) => setTplMessageEn(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {t("newsletter.variablesHint")}:
              <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{"{articleName}"}</code>
              <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{"{articleSubtitle}"}</code>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveTemplate.mutate()}
              disabled={saveTemplate.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {saveTemplate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t("newsletter.saveTemplate")}
            </button>
            {templateSaved && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {t("newsletter.templateSaved")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

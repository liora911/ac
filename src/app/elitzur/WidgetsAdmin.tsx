"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import { Check, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotification } from "@/contexts/NotificationContext";
import { useWidgets, useUpdateWidget } from "@/hooks/useWidgets";
import { WIDGET_META, getWidgetMeta } from "@/widgets/widgets.config";
import { WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetMeta } from "@/types/Widgets/widgets";

// Merge the widget's sample placeholder config with the real values so a
// preview is never blank (e.g. an announcement with no text yet).
function previewConfig(
  meta: WidgetMeta,
  cfg: Record<string, unknown> | null | undefined
): Record<string, string> {
  const merged: Record<string, string> = { ...(meta.sampleConfig ?? {}) };
  const c = (cfg ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(c)) {
    const v = c[k];
    if (typeof v === "string" && v.trim()) merged[k] = v;
  }
  return merged;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked
            ? "translate-x-5 rtl:-translate-x-5"
            : "translate-x-0.5 rtl:-translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function WidgetsAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showError } = useNotification();
  const { data: states } = useWidgets({ all: true });
  const updateWidget = useUpdateWidget();

  const [variantModalKey, setVariantModalKey] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [pendingVariant, setPendingVariant] = useState<string | null>(null);

  // Carousel
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!variantModalKey) return;
    const meta = getWidgetMeta(variantModalKey);
    const cfg = (states?.find((s) => s.key === variantModalKey)?.config ??
      {}) as Record<string, unknown>;
    const draft: Record<string, string> = {};
    meta?.configFields?.forEach((f) => {
      draft[f.key] = typeof cfg[f.key] === "string" ? (cfg[f.key] as string) : "";
    });
    setConfigDraft(draft);
    setPendingVariant(null);
  }, [variantModalKey, states]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  }, []);

  const goToCard = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(WIDGET_META.length - 1, i));
    (el.children[clamped] as HTMLElement | undefined)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  if (!isAuthorized) return <LoginForm />;

  const stateFor = (key: string) => states?.find((s) => s.key === key);
  const onError = (e: unknown) =>
    showError(e instanceof Error ? e.message : t("adminWidgets.error"));

  const toggleEnabled = (key: string, enabled: boolean) =>
    updateWidget.mutate({ key, enabled }, { onError });
  const pickVariant = (key: string, variant: string) => {
    setPendingVariant(variant);
    updateWidget.mutate({ key, variant }, { onError });
  };
  const saveConfig = (key: string) =>
    updateWidget.mutate({ key, config: configDraft }, { onError });
  const setVisibility = (key: string, visibility: "public" | "private") =>
    updateWidget.mutate({ key, visibility }, { onError });

  const modalMeta = variantModalKey ? getWidgetMeta(variantModalKey) : null;
  const modalEntry = variantModalKey ? WIDGET_REGISTRY[variantModalKey] : null;
  const modalState = variantModalKey ? stateFor(variantModalKey) : null;
  const currentVariant =
    pendingVariant ?? modalState?.variant ?? modalMeta?.defaultVariant;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("adminWidgets.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("adminWidgets.subtitle")}
        </p>
      </div>

      {/* Carousel — one widget at a time; scroll by arrows or mouse/trackpad */}
      <div className="relative">
        <button
          type="button"
          onClick={() => goToCard(index - 1)}
          disabled={index === 0}
          aria-label={t("common.previous")}
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => goToCard(index + 1)}
          disabled={index >= WIDGET_META.length - 1}
          aria-label={t("common.next")}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
        >
          {WIDGET_META.map((meta) => {
            const entry = WIDGET_REGISTRY[meta.key];
            const st = stateFor(meta.key);
            const enabled = st?.enabled ?? false;
            const activeVariant = st?.variant ?? meta.defaultVariant;
            const ActiveComp = entry?.variants[activeVariant] ?? undefined;
            const variantLabelKey =
              meta.variants.find((v) => v.key === activeVariant)?.labelKey ??
              meta.variants[0].labelKey;
            const visibility = st?.visibility ?? "public";

            return (
              <div
                key={meta.key}
                className="flex-shrink-0 w-full snap-center px-1"
              >
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm max-w-3xl mx-auto">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {t(meta.nameKey)}
                      </h3>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {t(meta.descriptionKey)}
                      </p>
                    </div>
                    <Toggle
                      checked={enabled}
                      onChange={(v) => toggleEnabled(meta.key, v)}
                      disabled={updateWidget.isPending}
                    />
                  </div>

                  {/* Live preview of the selected variant (non-interactive) */}
                  <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 overflow-hidden">
                    <div className="pointer-events-none">
                      {ActiveComp ? (
                        <ActiveComp config={previewConfig(meta, st?.config)} />
                      ) : entry?.Preview ? (
                        <entry.Preview />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t("adminWidgets.slot")}: {t(`widgets.slots.${meta.slot}`)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVariantModalKey(meta.key)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4" />
                      {t("adminWidgets.chooseVariant")}
                      <span className="text-gray-400">· {t(variantLabelKey)}</span>
                    </button>
                  </div>

                  {/* Public vs admin-only visibility */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("adminWidgets.visibility")}:
                    </span>
                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {(["public", "private"] as const).map((vis) => {
                        const current = visibility === vis;
                        return (
                          <button
                            key={vis}
                            type="button"
                            onClick={() => setVisibility(meta.key, vis)}
                            disabled={updateWidget.isPending}
                            className={`px-2.5 py-1 font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                              current
                                ? vis === "private"
                                  ? "bg-amber-500 text-white"
                                  : "bg-blue-600 text-white"
                                : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {t(`adminWidgets.${vis}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {WIDGET_META.map((meta, i) => (
            <button
              key={meta.key}
              type="button"
              onClick={() => goToCard(i)}
              aria-label={t(meta.nameKey)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === index
                  ? "w-6 bg-blue-500"
                  : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!variantModalKey}
        onClose={() => setVariantModalKey(null)}
        title={
          modalMeta
            ? t("adminWidgets.pickVariant").replace("{name}", t(modalMeta.nameKey))
            : ""
        }
        hideFooter
        maxWidthClass="max-w-6xl"
      >
        {modalMeta && modalEntry && (
          <div className="space-y-6">
            {/* Settings form (only for widgets that declare fields) */}
            {modalMeta.configFields && modalMeta.configFields.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t("adminWidgets.settings")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalMeta.configFields.map((field) => (
                    <div
                      key={field.key}
                      className={field.type === "textarea" ? "sm:col-span-2" : ""}
                    >
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t(field.labelKey)}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={configDraft[field.key] ?? ""}
                          onChange={(e) =>
                            setConfigDraft((d) => ({
                              ...d,
                              [field.key]: e.target.value,
                            }))
                          }
                          rows={4}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={configDraft[field.key] ?? ""}
                          onChange={(e) =>
                            setConfigDraft((d) => ({
                              ...d,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.labelKey)}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "color" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={configDraft[field.key] || "#3b82f6"}
                            onChange={(e) =>
                              setConfigDraft((d) => ({
                                ...d,
                                [field.key]: e.target.value,
                              }))
                            }
                            className="h-9 w-12 flex-shrink-0 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent"
                          />
                          <input
                            type="text"
                            value={configDraft[field.key] ?? ""}
                            onChange={(e) =>
                              setConfigDraft((d) => ({
                                ...d,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder="#3b82f6"
                            dir="ltr"
                            className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {configDraft[field.key] && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfigDraft((d) => ({ ...d, [field.key]: "" }))
                              }
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                            >
                              {t("adminWidgets.resetColor")}
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type === "url" ? "url" : "text"}
                          value={configDraft[field.key] ?? ""}
                          onChange={(e) =>
                            setConfigDraft((d) => ({
                              ...d,
                              [field.key]: e.target.value,
                            }))
                          }
                          dir={field.type === "url" ? "ltr" : "auto"}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => saveConfig(modalMeta.key)}
                    disabled={updateWidget.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {t("adminWidgets.saveSettings")}
                  </button>
                </div>
              </div>
            )}

            {/* Variant chooser — large previews reflecting the current settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modalMeta.variants.map((v) => {
                const VariantComp = modalEntry.variants[v.key];
                const isSelected = currentVariant === v.key;
                return (
                  <div
                    key={v.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => pickVariant(modalMeta.key, v.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickVariant(modalMeta.key, v.key);
                      }
                    }}
                    className={`text-start rounded-xl border-2 p-4 transition cursor-pointer ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t(v.labelKey)}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Check className="w-3.5 h-3.5" />
                          {t("adminWidgets.selected")}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden rounded-lg pointer-events-none">
                      {VariantComp ? (
                        <VariantComp config={previewConfig(modalMeta, configDraft)} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

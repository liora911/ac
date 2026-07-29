"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import { Check, Settings2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotification } from "@/contexts/NotificationContext";
import { useWidgets, useUpdateWidget } from "@/hooks/useWidgets";
import { WIDGET_META, getWidgetMeta } from "@/widgets/widgets.config";
import { WIDGET_REGISTRY } from "@/widgets/registry";

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

  // Seed the config form from the widget's stored config when the modal opens
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
  }, [variantModalKey, states]);

  if (!isAuthorized) return <LoginForm />;

  const stateFor = (key: string) => states?.find((s) => s.key === key);
  const onError = (e: unknown) =>
    showError(e instanceof Error ? e.message : t("adminWidgets.error"));

  const toggleEnabled = (key: string, enabled: boolean) =>
    updateWidget.mutate({ key, enabled }, { onError });
  const pickVariant = (key: string, variant: string) =>
    updateWidget.mutate({ key, variant }, { onError });
  const saveConfig = (key: string) =>
    updateWidget.mutate({ key, config: configDraft }, { onError });

  const modalMeta = variantModalKey ? getWidgetMeta(variantModalKey) : null;
  const modalEntry = variantModalKey ? WIDGET_REGISTRY[variantModalKey] : null;
  const modalState = variantModalKey ? stateFor(variantModalKey) : null;
  const currentVariant = modalState?.variant ?? modalMeta?.defaultVariant;

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {WIDGET_META.map((meta) => {
          const entry = WIDGET_REGISTRY[meta.key];
          const st = stateFor(meta.key);
          const enabled = st?.enabled ?? false;
          const Preview = entry?.Preview;
          const activeVariant = st?.variant ?? meta.defaultVariant;
          const variantLabelKey =
            meta.variants.find((v) => v.key === activeVariant)?.labelKey ??
            meta.variants[0].labelKey;

          return (
            <div
              key={meta.key}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {t(meta.nameKey)}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {t(meta.descriptionKey)}
                  </p>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(v) => toggleEnabled(meta.key, v)}
                  disabled={updateWidget.isPending}
                />
              </div>

              <button
                type="button"
                onClick={() => setVariantModalKey(meta.key)}
                className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 text-start hover:ring-2 hover:ring-blue-400 transition cursor-pointer overflow-hidden"
                title={t("adminWidgets.chooseVariant")}
              >
                {Preview ? <Preview /> : null}
              </button>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="truncate">
                  {t("adminWidgets.slot")}: {t(`widgets.slots.${meta.slot}`)}
                </span>
                <button
                  type="button"
                  onClick={() => setVariantModalKey(meta.key)}
                  className="inline-flex items-center gap-1 flex-shrink-0 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {t(variantLabelKey)}
                </button>
              </div>
            </div>
          );
        })}
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
            {/* Config editor (only for widgets that declare fields) */}
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
                          rows={3}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
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

            {/* Variant chooser — large side-by-side previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modalMeta.variants.map((v) => {
                const VariantComp = modalEntry.variants[v.key];
                const isSelected = currentVariant === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => {
                      pickVariant(modalMeta.key, v.key);
                      setVariantModalKey(null);
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
                    <div className="overflow-hidden rounded-lg">
                      {VariantComp ? <VariantComp config={configDraft} /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

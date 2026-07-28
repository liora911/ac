"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import {
  useGuests,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
} from "@/hooks/useGuests";
import Modal from "@/components/Modal/Modal";
import DragDropImageUpload from "@/components/Upload/upload";
import TiptapEditor from "@/lib/editor/editor";
import { useSiteSettings, siteSettingsKeys } from "@/hooks/useSiteSettings";
import { useQueryClient } from "@tanstack/react-query";
import type { Guest } from "@/types/Guests/guests";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Loader2,
} from "lucide-react";

type CategoryOption = { id: string; name: string };

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
          checked ? "ltr:translate-x-5 rtl:-translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const cardCls =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm";

// ---------- Public Guests-page subtitle editor ----------

function PageSubtitleEditor() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();

  const [he, setHe] = useState("");
  const [en, setEn] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Seed the inputs once settings arrive
  useEffect(() => {
    if (settings && !loaded) {
      setHe(settings.guestsSubtitleHe ?? "");
      setEn(settings.guestsSubtitleEn ?? "");
      setLoaded(true);
    }
  }, [settings, loaded]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestsSubtitleHe: he, guestsSubtitleEn: en }),
      });
      if (!res.ok) throw new Error("save failed");
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.all });
      showSuccess(t("adminGuests.savedSuccess"));
    } catch {
      showError(t("adminGuests.errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {t("adminGuests.pageSubtitleTitle")}
      </h3>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {t("adminGuests.pageSubtitleHint")}
      </p>
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("adminGuests.pageSubtitleHe")}
          </label>
          <input
            type="text"
            value={he}
            onChange={(e) => setHe(e.target.value)}
            dir="rtl"
            placeholder={t("guests.subtitle")}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t("adminGuests.pageSubtitleEn")}
          </label>
          <input
            type="text"
            value={en}
            onChange={(e) => setEn(e.target.value)}
            dir="ltr"
            className={inputCls}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !loaded}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t("adminGuests.saving") : t("adminGuests.save")}
        </button>
      </div>
    </div>
  );
}

// ---------- Guest create/edit form ----------

function GuestForm({
  guest,
  onDone,
}: {
  guest: Guest | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();

  const [name, setName] = useState(guest?.name ?? "");
  const [nameEn, setNameEn] = useState(guest?.nameEn ?? "");
  const [slug, setSlug] = useState(guest?.slug ?? "");
  const [headline, setHeadline] = useState(guest?.headline ?? "");
  const [bio, setBio] = useState(guest?.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState(guest?.photoUrl ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(
    guest?.bannerImageUrl ?? ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(guest?.websiteUrl ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [titleDirection, setTitleDirection] = useState(
    guest?.titleDirection ?? "rtl"
  );
  const [published, setPublished] = useState(guest?.published ?? false);
  const [isFeatured, setIsFeatured] = useState(guest?.isFeatured ?? false);

  const saving = createGuest.isPending || updateGuest.isPending;

  const handleSave = async () => {
    if (!name.trim()) {
      showError(t("adminGuests.nameRequired"));
      return;
    }
    const payload = {
      name,
      nameEn,
      slug,
      headline,
      bio,
      photoUrl,
      bannerImageUrl,
      websiteUrl,
      email,
      titleDirection,
      published,
      isFeatured,
    };
    try {
      if (guest) {
        await updateGuest.mutateAsync({ id: guest.id, ...payload });
      } else {
        await createGuest.mutateAsync(payload);
      }
      showSuccess(t("adminGuests.savedSuccess"));
      onDone();
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminGuests.errorGeneric"));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        {guest ? t("adminGuests.editGuest") : t("adminGuests.addGuest")}
      </h3>

      <div className={cardCls}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.name")} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              dir="auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.nameEn")}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className={inputCls}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.slug")}
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputCls}
              dir="ltr"
              placeholder={t("adminGuests.slugPlaceholder")}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {t("adminGuests.slugHint")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.headline")}
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className={inputCls}
              dir="auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.website")}
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className={inputCls}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              dir="ltr"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {t("adminGuests.emailHint")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.direction")}
            </label>
            <select
              value={titleDirection}
              onChange={(e) => setTitleDirection(e.target.value)}
              className={inputCls}
            >
              <option value="rtl">{t("adminGuests.dirRtl")}</option>
              <option value="ltr">{t("adminGuests.dirLtr")}</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <Toggle checked={published} onChange={setPublished} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("adminGuests.publishedLabel")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={isFeatured} onChange={setIsFeatured} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("adminGuests.featuredLabel")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardCls}>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t("adminGuests.photo")}
          </h4>
          <DragDropImageUpload
            onImageSelect={(url) => setPhotoUrl(url || "")}
            currentImage={photoUrl || undefined}
            placeholder="PNG, JPG, WebP (max 5MB)"
          />
        </div>
        <div className={cardCls}>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t("adminGuests.banner")}
          </h4>
          <DragDropImageUpload
            onImageSelect={(url) => setBannerImageUrl(url || "")}
            currentImage={bannerImageUrl || undefined}
            placeholder="PNG, JPG, WebP (max 5MB)"
          />
        </div>
      </div>

      <div className={cardCls}>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t("adminGuests.bio")}
        </h4>
        <TiptapEditor
          value={bio}
          onChange={setBio}
          direction={titleDirection === "rtl" ? "rtl" : "ltr"}
          theme="light"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          {t("adminGuests.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t("adminGuests.saving") : t("adminGuests.save")}
        </button>
      </div>
    </div>
  );
}


// ---------- Main admin tab ----------

export default function GuestsAdmin() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const { data: guests, isLoading } = useGuests({ all: true });
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();

  const [guestForm, setGuestForm] = useState<{ guest: Guest | null } | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const deepLinkHandled = useRef(false);

  // Honor the quick-edit deep link (/elitzur?tab=guests&editGuest=<id>) once
  // the guests have loaded — opens that guest's edit form immediately
  useEffect(() => {
    if (deepLinkHandled.current || !guests) return;
    const editGuest = new URLSearchParams(window.location.search).get(
      "editGuest"
    );
    if (!editGuest) {
      deepLinkHandled.current = true;
      return;
    }
    const guest = guests.find((g) => g.id === editGuest);
    if (guest) {
      setGuestForm({ guest });
      deepLinkHandled.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("editGuest");
      window.history.replaceState(null, "", url.toString());
    }
  }, [guests]);

  const togglePublished = async (guest: Guest) => {
    try {
      await updateGuest.mutateAsync({
        id: guest.id,
        published: !guest.published,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminGuests.errorGeneric"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGuest.mutateAsync(deleteTarget.id);
      showSuccess(t("adminGuests.deletedSuccess"));
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminGuests.errorGeneric"));
    } finally {
      setDeleteTarget(null);
    }
  };

  if (guestForm) {
    return (
      <GuestForm guest={guestForm.guest} onDone={() => setGuestForm(null)} />
    );
  }

  return (
    <div className="space-y-4">
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("adminGuests.deleteGuestTitle")}
        message={t("adminGuests.deleteGuestMessage")}
        showCancel
        cancelText={t("adminGuests.cancel")}
        confirmText={t("adminGuests.confirmDelete")}
        onConfirm={handleDelete}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("adminGuests.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("adminGuests.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGuestForm({ guest: null })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("adminGuests.addGuest")}
        </button>
      </div>

      <PageSubtitleEditor />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !guests || guests.length === 0 ? (
        <div className={`${cardCls} text-center text-gray-500 dark:text-gray-400 py-12`}>
          {t("adminGuests.empty")}
        </div>
      ) : (
        guests.map((guest) => (
          <div
            key={guest.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center gap-4 flex-wrap"
          >
            {guest.photoUrl ? (
              <img
                src={guest.photoUrl}
                alt={guest.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {guest.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-2">
                <span
                  dir={guest.titleDirection}
                  className="font-semibold text-gray-900 dark:text-white"
                >
                  {guest.name}
                </span>
                {guest.isFeatured && (
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    guest.published
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {guest.published
                    ? t("adminGuests.published")
                    : t("adminGuests.unpublished")}
                </span>
                {guest.headline && (
                  <span dir={guest.titleDirection} className="truncate max-w-[220px]">
                    {guest.headline}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {guest.published && (
                <Link
                  href={`/guests/${guest.slug || guest.id}`}
                  target="_blank"
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t("adminGuests.view")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => togglePublished(guest)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title={
                  guest.published
                    ? t("adminGuests.unpublish")
                    : t("adminGuests.publish")
                }
              >
                {guest.published ? (
                  <Eye className="w-4 h-4 text-green-500" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setGuestForm({ guest })}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title={t("adminGuests.edit")}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(guest)}
                className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                title={t("adminGuests.delete")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

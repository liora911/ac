"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import {
  useGuests,
  useGuest,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
  useCreateGuestWork,
  useUpdateGuestWork,
  useDeleteGuestWork,
} from "@/hooks/useGuests";
import Modal from "@/components/Modal/Modal";
import DragDropImageUpload from "@/components/Upload/upload";
import MultiImageUpload from "@/components/Upload/MultiImageUpload";
import PdfUpload from "@/components/Upload/PdfUpload";
import TiptapEditor from "@/lib/editor/editor";
import type { Guest, GuestWork } from "@/types/Guests/guests";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Loader2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
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

// ---------- Work create/edit form ----------

function WorkForm({
  guestId,
  work,
  onDone,
}: {
  guestId: string;
  work: GuestWork | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const createWork = useCreateGuestWork();
  const updateWork = useUpdateGuestWork();

  const [title, setTitle] = useState(work?.title ?? "");
  const [description, setDescription] = useState(work?.description ?? "");
  const [content, setContent] = useState(work?.content ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(work?.imageUrls ?? []);
  const [pdfUrl, setPdfUrl] = useState(work?.pdfUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(work?.videoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(work?.coverImageUrl ?? "");
  const [categoryId, setCategoryId] = useState(work?.categoryId ?? "");
  const [titleDirection, setTitleDirection] = useState(
    work?.titleDirection ?? "rtl"
  );
  const [published, setPublished] = useState(work?.published ?? false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const saving = createWork.isPending || updateWork.isPending;

  const handleSave = async () => {
    if (!title.trim()) {
      showError(t("adminGuests.titleRequired"));
      return;
    }
    const payload = {
      title,
      description,
      content,
      imageUrls,
      pdfUrl,
      videoUrl,
      coverImageUrl,
      categoryId: categoryId || null,
      titleDirection,
      published,
    };
    try {
      if (work) {
        await updateWork.mutateAsync({ id: work.id, ...payload });
      } else {
        await createWork.mutateAsync({ guestId, ...payload });
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
        {work ? t("adminGuests.editWork") : t("adminGuests.addWork")}
      </h3>

      <div className={cardCls}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.workTitle")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              dir="auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.category")}
            </label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t("adminGuests.noCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls}
              dir="auto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("adminGuests.video")}
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={inputCls}
              dir="ltr"
              placeholder="https://www.youtube.com/watch?v=..."
            />
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

        <div className="mt-5 flex items-center gap-3">
          <Toggle checked={published} onChange={setPublished} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("adminGuests.publishedLabel")}
          </span>
        </div>
      </div>

      <div className={cardCls}>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t("adminGuests.cover")}
        </h4>
        <DragDropImageUpload
          onImageSelect={(url) => setCoverImageUrl(url || "")}
          currentImage={coverImageUrl || undefined}
          placeholder="PNG, JPG, WebP (max 5MB)"
        />
      </div>

      <div className={cardCls}>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t("adminGuests.gallery")}
        </h4>
        <MultiImageUpload imageUrls={imageUrls} onChange={setImageUrls} />
      </div>

      <div className={cardCls}>
        <PdfUpload
          pdfUrl={pdfUrl || null}
          onChange={(url) => setPdfUrl(url || "")}
          labels={{ title: t("adminGuests.pdf") }}
        />
      </div>

      <div className={cardCls}>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t("adminGuests.contentLabel")}
        </h4>
        <TiptapEditor
          value={content}
          onChange={setContent}
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

// ---------- Works manager for one guest ----------

function WorksView({
  guestId,
  onEditWork,
  onAddWork,
  onBack,
}: {
  guestId: string;
  onEditWork: (work: GuestWork) => void;
  onAddWork: () => void;
  onBack: () => void;
}) {
  const { t, locale } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const { data: guest, isLoading } = useGuest(guestId);
  const updateWork = useUpdateGuestWork();
  const deleteWork = useDeleteGuestWork();
  const [deleteTarget, setDeleteTarget] = useState<GuestWork | null>(null);

  const BackArrow = locale === "he" ? ArrowRight : ArrowLeft;

  const togglePublished = async (work: GuestWork) => {
    try {
      await updateWork.mutateAsync({ id: work.id, published: !work.published });
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminGuests.errorGeneric"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWork.mutateAsync(deleteTarget.id);
      showSuccess(t("adminGuests.deletedSuccess"));
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminGuests.errorGeneric"));
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const works = guest?.works ?? [];

  return (
    <div className="space-y-4">
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("adminGuests.deleteWorkTitle")}
        message={t("adminGuests.deleteWorkMessage")}
        showCancel
        cancelText={t("adminGuests.cancel")}
        confirmText={t("adminGuests.confirmDelete")}
        onConfirm={handleDelete}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label={t("adminGuests.back")}
          >
            <BackArrow className="w-4 h-4" />
          </button>
          <h3
            dir={guest?.titleDirection}
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            {t("adminGuests.worksOf")} {guest?.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onAddWork}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("adminGuests.addWork")}
        </button>
      </div>

      {works.length === 0 ? (
        <div className={`${cardCls} text-center text-gray-500 dark:text-gray-400 py-12`}>
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {t("adminGuests.noWorks")}
        </div>
      ) : (
        works.map((work) => (
          <div
            key={work.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center gap-4 flex-wrap"
          >
            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
              {(work.coverImageUrl || work.imageUrls[0]) && (
                <img
                  src={work.coverImageUrl || work.imageUrls[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-[180px]">
              <div
                dir={work.titleDirection}
                className="font-semibold text-gray-900 dark:text-white"
              >
                {work.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    work.published
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {work.published
                    ? t("adminGuests.published")
                    : t("adminGuests.unpublished")}
                </span>
                {work.category && <span>{work.category.name}</span>}
                {work.imageUrls.length > 0 && (
                  <span>
                    {work.imageUrls.length} {t("adminGuests.imagesCount")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => togglePublished(work)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title={
                  work.published
                    ? t("adminGuests.unpublish")
                    : t("adminGuests.publish")
                }
              >
                {work.published ? (
                  <Eye className="w-4 h-4 text-green-500" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onEditWork(work)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title={t("adminGuests.edit")}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(work)}
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
  const [worksGuestId, setWorksGuestId] = useState<string | null>(null);
  const [workForm, setWorkForm] = useState<{
    guestId: string;
    work: GuestWork | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

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

  if (workForm) {
    return (
      <WorkForm
        guestId={workForm.guestId}
        work={workForm.work}
        onDone={() => setWorkForm(null)}
      />
    );
  }

  if (guestForm) {
    return (
      <GuestForm guest={guestForm.guest} onDone={() => setGuestForm(null)} />
    );
  }

  if (worksGuestId) {
    return (
      <WorksView
        guestId={worksGuestId}
        onEditWork={(work) => setWorkForm({ guestId: worksGuestId, work })}
        onAddWork={() => setWorkForm({ guestId: worksGuestId, work: null })}
        onBack={() => setWorksGuestId(null)}
      />
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
                <span>
                  {guest._count?.works ?? 0} {t("adminGuests.worksCount")}
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
                onClick={() => setWorksGuestId(guest.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {t("adminGuests.works")}
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

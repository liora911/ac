"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotification } from "@/contexts/NotificationContext";
import { useGuest, useUpdateGuest } from "@/hooks/useGuests";
import DragDropImageUpload from "@/components/Upload/upload";
import MultiImageUpload from "@/components/Upload/MultiImageUpload";
import TiptapEditor from "@/lib/editor/editor";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const cardCls =
  "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm";

export default function GuestOwnerEditPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { status } = useSession();
  const { showSuccess, showError } = useNotification();
  const { data: guest, isLoading, isError } = useGuest(params?.slug);
  const updateGuest = useUpdateGuest();

  const BackArrow = locale === "he" ? ArrowRight : ArrowLeft;

  // Owner-editable content only
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [titleDirection, setTitleDirection] = useState("rtl");
  const [bioDirection, setBioDirection] = useState<"ltr" | "rtl">("rtl");
  const [seeded, setSeeded] = useState(false);

  // Seed the form once the guest loads
  useEffect(() => {
    if (!guest || seeded) return;
    setName(guest.name ?? "");
    setNameEn(guest.nameEn ?? "");
    setHeadline(guest.headline ?? "");
    setBio(guest.bio ?? "");
    setPhotoUrl(guest.photoUrl ?? "");
    setBannerImageUrl(guest.bannerImageUrl ?? "");
    setGalleryUrls(guest.galleryUrls ?? []);
    setWebsiteUrl(guest.websiteUrl ?? "");
    setTitleDirection(guest.titleDirection ?? "rtl");
    setBioDirection((guest.titleDirection as "ltr" | "rtl") ?? "rtl");
    setSeeded(true);
  }, [guest, seeded]);

  const handleSave = async () => {
    if (!guest) return;
    if (!name.trim()) {
      showError(t("adminGuests.nameRequired"));
      return;
    }
    try {
      await updateGuest.mutateAsync({
        id: guest.id,
        name,
        nameEn,
        headline,
        bio,
        photoUrl,
        bannerImageUrl,
        galleryUrls,
        websiteUrl,
        titleDirection,
      });
      showSuccess(t("adminGuests.savedSuccess"));
      router.push(`/guests/${guest.slug || guest.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : t("adminGuests.errorGeneric"));
    }
  };

  // ---- gate states ----
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    const callbackUrl = `/guests/${params?.slug}/edit`;
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t("guestEdit.signInRequired")}
        </p>
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {t("guestEdit.signIn")}
        </Link>
      </div>
    );
  }

  if (isError || !guest || !guest.canEdit) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t("guestEdit.notAllowed")}
        </p>
        <Link
          href={guest ? `/guests/${guest.slug || guest.id}` : "/guests"}
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <BackArrow className="w-4 h-4" />
          {t("guests.backToGuests")}
        </Link>
      </div>
    );
  }

  const saving = updateGuest.isPending;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {t("guestEdit.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("guestEdit.subtitle")}
            </p>
          </div>
          <Link
            href={`/guests/${guest.slug || guest.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
          >
            <BackArrow className="w-4 h-4" />
            {t("guests.backToGuests")}
          </Link>
        </div>

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
            direction={bioDirection}
            onDirectionChange={setBioDirection}
            theme="light"
          />
        </div>

        <div className={cardCls}>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {t("adminGuests.gallery")}
          </h4>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {t("adminGuests.galleryHint")}
          </p>
          <MultiImageUpload imageUrls={galleryUrls} onChange={setGalleryUrls} />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/guests/${guest.slug || guest.id}`}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t("adminGuests.cancel")}
          </Link>
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
    </div>
  );
}

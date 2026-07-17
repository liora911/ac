"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import {
  useArchive,
  useCreateArchive,
  useUpdateArchive,
  useDeleteArchive,
} from "@/hooks/useArchive";
import TiptapEditor from "@/lib/editor/editor";
import DragDropImageUpload from "@/components/Upload/upload";
import UnauthorizedScreen from "@/components/Auth/UnauthorizedScreen";
import RichContent from "@/components/RichContent";
import {
  Plus,
  Loader2,
  Trash2,
  Edit3,
  X,
  Save,
  Image as ImageIcon,
  Video,
  Search,
  FileText,
  ChevronLeft,
} from "lucide-react";
import type { Archive, ArchiveFormData } from "@/types/Archive/archive";
import { getYouTubeVideoId } from "@/lib/utils/youtube";
import { stripHtml } from "@/lib/utils/stripHtml";

export default function ArchivePage() {
  const { t, locale } = useTranslation();
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useNotification();
  const isRTL = locale === "he";

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  const { data: archives, isLoading, error } = useArchive();
  const createMutation = useCreateArchive();
  const updateMutation = useUpdateArchive();
  const deleteMutation = useDeleteArchive();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Archive | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Archive | null>(null);

  const [formData, setFormData] = useState<ArchiveFormData>({
    title: "",
    content: "",
    mediaUrl: "",
    mediaType: "NONE",
    category: "",
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!archives) return [];
    const cats = new Set(archives.map((a) => a.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [archives]);

  const filteredArchives = useMemo(() => {
    if (!archives) return [];
    let filtered = archives;
    if (activeCategory) {
      filtered = filtered.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          stripHtml(item.content).toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [archives, searchQuery, activeCategory]);

  const groupedArchives = useMemo(() => {
    const groups: Record<string, Archive[]> = {};
    for (const item of filteredArchives) {
      const cat = item.category || t("archive.uncategorized");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [filteredArchives, t]);

  const resetForm = () => {
    setFormData({ title: "", content: "", mediaUrl: "", mediaType: "NONE", category: "" });
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
    setSelectedItem(null);
  };

  const openEditForm = (archive: Archive) => {
    setFormData({
      title: archive.title,
      content: archive.content,
      mediaUrl: archive.mediaUrl || "",
      mediaType: archive.mediaType,
      category: archive.category || "",
    });
    setEditingItem(archive);
    setIsFormOpen(true);
    setSelectedItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showError(t("archive.titleContentRequired"));
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: {
            title: formData.title,
            content: formData.content,
            mediaUrl: formData.mediaUrl || null,
            mediaType: formData.mediaType,
            category: formData.category || null,
          },
        });
        showSuccess(t("archive.itemUpdated"));
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          mediaUrl: formData.mediaUrl || undefined,
          mediaType: formData.mediaType,
          category: formData.category || undefined,
        });
        showSuccess(t("archive.itemCreated"));
      }
      resetForm();
    } catch {
      showError(t("archive.saveError"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("archive.deleteConfirm"))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess(t("archive.itemDeleted"));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch {
      showError(t("archive.deleteError"));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <UnauthorizedScreen />;
  }

  // Detail view for a selected item
  if (selectedItem) {
    const youtubeId =
      selectedItem.mediaType === "VIDEO"
        ? getYouTubeVideoId(selectedItem.mediaUrl)
        : null;

    return (
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedItem(null)}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors cursor-pointer"
          >
            <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            <span>{t("archive.title")}</span>
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Media */}
            {selectedItem.mediaType === "IMAGE" && selectedItem.mediaUrl && (
              <div className="w-full max-h-[400px] overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                  src={selectedItem.mediaUrl}
                  alt={selectedItem.title}
                  className="w-full max-h-[400px] object-contain"
                />
              </div>
            )}
            {selectedItem.mediaType === "VIDEO" && youtubeId && (
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={selectedItem.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedItem.title}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditForm(selectedItem)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                    title={t("archive.edit")}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title={t("archive.delete")}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-6">
                {selectedItem.category && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                    {selectedItem.category}
                  </span>
                )}
                {new Date(selectedItem.createdAt).toLocaleDateString(
                  isRTL ? "he-IL" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <RichContent content={selectedItem.content} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t("archive.title")}
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 start-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("common.search")}
                className="w-full sm:w-64 ps-10 pe-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {!isFormOpen && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {t("archive.newItem")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Create/Edit Form */}
        {isFormOpen && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? t("archive.editItem") : t("archive.newItem")}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("archive.titleLabel")} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("archive.enterTitle")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("archive.contentLabel")} *
                </label>
                <TiptapEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder={t("archive.enterContent")}
                  direction={isRTL ? "rtl" : "ltr"}
                  theme="light"
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("archive.category")}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("archive.enterCategory")}
                  list="archive-categories"
                />
                {categories.length > 0 && (
                  <datalist id="archive-categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("archive.mediaType")}
                </label>
                <div className="flex gap-2">
                  {(["NONE", "IMAGE", "VIDEO"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, mediaType: type, mediaUrl: "" })
                      }
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                        formData.mediaType === type
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {type === "IMAGE" && <ImageIcon className="w-4 h-4" />}
                      {type === "VIDEO" && <Video className="w-4 h-4" />}
                      {t(`archive.${type === "NONE" ? "none" : type === "IMAGE" ? "image" : "video"}`)}
                    </button>
                  ))}
                </div>
              </div>
              {formData.mediaType === "IMAGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("archive.uploadImage")}
                  </label>
                  <DragDropImageUpload
                    onImageSelect={(url) =>
                      setFormData({ ...formData, mediaUrl: url || "" })
                    }
                    currentImage={formData.mediaUrl || undefined}
                    placeholder="PNG, JPG, GIF, WebP (max 5MB)"
                    onError={(msg) => showError(msg)}
                  />
                </div>
              )}
              {formData.mediaType === "VIDEO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("archive.youtubeUrl")}
                  </label>
                  <input
                    type="text"
                    value={formData.mediaUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, mediaUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.youtube.com/watch?v=..."
                    dir="ltr"
                  />
                  {formData.mediaUrl && getYouTubeVideoId(formData.mediaUrl) && (
                    <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.mediaUrl)}`}
                        title="Preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  {t("archive.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("archive.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t("archive.save")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 text-red-500">
            {t("archive.loadError")}
          </div>
        )}

        {/* Category Filter Chips */}
        {!isLoading && !error && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t("common.all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredArchives.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>{searchQuery ? t("common.noResults") : t("archive.noItems")}</p>
          </div>
        )}

        {/* Grouped Card Grid */}
        {!isLoading && !error && filteredArchives.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedArchives).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full" />
                  {category}
                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                    ({items.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <ArchiveCard
                      key={item.id}
                      archive={item}
                      isRTL={isRTL}
                      onSelect={() => setSelectedItem(item)}
                      onEdit={() => openEditForm(item)}
                      onDelete={() => handleDelete(item.id)}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ArchiveCardProps {
  archive: Archive;
  isRTL: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ArchiveCard({
  archive,
  isRTL,
  onSelect,
  onEdit,
  onDelete,
  isDeleting,
}: ArchiveCardProps) {
  const { t } = useTranslation();
  const snippet = stripHtml(archive.content).slice(0, 120);
  const youtubeId =
    archive.mediaType === "VIDEO" ? getYouTubeVideoId(archive.mediaUrl) : null;

  const mediaBadge =
    archive.mediaType === "IMAGE" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
        <ImageIcon className="w-3 h-3" />
      </span>
    ) : archive.mediaType === "VIDEO" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
        <Video className="w-3 h-3" />
      </span>
    ) : null;

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer flex flex-col"
      onClick={onSelect}
    >
      {/* Thumbnail */}
      {archive.mediaType === "IMAGE" && archive.mediaUrl ? (
        <div className="h-40 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <img
            src={archive.mediaUrl}
            alt={archive.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : youtubeId ? (
        <div className="h-40 overflow-hidden bg-black">
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
            alt={archive.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 flex items-center justify-center">
          <FileText className="w-10 h-10 text-blue-300 dark:text-blue-700" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 flex-1">
            {archive.title}
          </h3>
          {mediaBadge}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-3 flex-1">
          {snippet}
          {snippet.length >= 120 ? "..." : ""}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {new Date(archive.createdAt).toLocaleDateString(
              isRTL ? "he-IL" : "en-US",
              { month: "short", day: "numeric", year: "numeric" },
            )}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer"
              title={t("archive.edit")}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title={t("archive.delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

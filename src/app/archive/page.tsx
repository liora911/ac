"use client";

import React, { useState } from "react";
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
  Minus,
  Loader2,
  Trash2,
  Edit3,
  X,
  Save,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import type { Archive, ArchiveMediaType, ArchiveFormData } from "@/types/Archive/archive";
import { getYouTubeVideoId } from "@/lib/utils/youtube";

export default function ArchivePage() {
  const { t, locale } = useTranslation();
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useNotification();
  const isRTL = locale === "he";

  // Auth check
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Data fetching
  const { data: archives, isLoading, error } = useArchive();
  const createMutation = useCreateArchive();
  const updateMutation = useUpdateArchive();
  const deleteMutation = useDeleteArchive();

  // UI state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Archive | null>(null);

  // Form state
  const [formData, setFormData] = useState<ArchiveFormData>({
    title: "",
    content: "",
    mediaUrl: "",
    mediaType: "NONE",
  });

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      mediaUrl: "",
      mediaType: "NONE",
    });
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (archive: Archive) => {
    setFormData({
      title: archive.title,
      content: archive.content,
      mediaUrl: archive.mediaUrl || "",
      mediaType: archive.mediaType,
    });
    setEditingItem(archive);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showError(isRTL ? "יש למלא כותרת ותוכן" : "Title and content are required");
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
          },
        });
        showSuccess(isRTL ? "הפריט עודכן בהצלחה" : "Item updated successfully");
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          mediaUrl: formData.mediaUrl || undefined,
          mediaType: formData.mediaType,
        });
        showSuccess(isRTL ? "הפריט נוצר בהצלחה" : "Item created successfully");
      }
      resetForm();
    } catch (error) {
      showError(isRTL ? "שגיאה בשמירה" : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? "האם למחוק פריט זה?" : "Delete this item?")) return;

    try {
      await deleteMutation.mutateAsync(id);
      showSuccess(isRTL ? "הפריט נמחק" : "Item deleted");
    } catch (error) {
      showError(isRTL ? "שגיאה במחיקה" : "Failed to delete");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return <UnauthorizedScreen />;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "ארכיון" : "Archive"}
          </h1>
          {!isFormOpen && (
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">
                {isRTL ? "פריט חדש" : "New Item"}
              </span>
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {isFormOpen && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem
                  ? isRTL
                    ? "עריכת פריט"
                    : "Edit Item"
                  : isRTL
                  ? "פריט חדש"
                  : "New Item"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "כותרת" : "Title"} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isRTL ? "הזן כותרת..." : "Enter title..."}
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "תוכן" : "Content"} *
                </label>
                <TiptapEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder={isRTL ? "הזן תוכן..." : "Enter content..."}
                  direction={isRTL ? "rtl" : "ltr"}
                  theme="light"
                />
              </div>

              {/* Media Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "סוג מדיה" : "Media Type"}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, mediaType: "NONE", mediaUrl: "" })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors cursor-pointer ${
                      formData.mediaType === "NONE"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {isRTL ? "ללא" : "None"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, mediaType: "IMAGE", mediaUrl: "" })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      formData.mediaType === "IMAGE"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    {isRTL ? "תמונה" : "Image"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, mediaType: "VIDEO", mediaUrl: "" })
                    }
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      formData.mediaType === "VIDEO"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    {isRTL ? "וידאו" : "Video"}
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              {formData.mediaType === "IMAGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "העלאת תמונה" : "Upload Image"}
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

              {/* YouTube URL Input */}
              {formData.mediaType === "VIDEO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "קישור יוטיוב" : "YouTube URL"}
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
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                          formData.mediaUrl
                        )}`}
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  {isRTL ? "ביטול" : "Cancel"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRTL ? "שומר..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isRTL ? "שמור" : "Save"}
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
            {isRTL ? "שגיאה בטעינת הנתונים" : "Failed to load data"}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && archives?.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {isRTL ? "אין פריטים בארכיון" : "No items in archive"}
          </div>
        )}

        {/* Archive List */}
        {!isLoading && !error && archives && archives.length > 0 && (
          <div className="space-y-3">
            {archives.map((item) => (
              <ArchiveItem
                key={item.id}
                archive={item}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleExpand(item.id)}
                onEdit={() => openEditForm(item)}
                onDelete={() => handleDelete(item.id)}
                isDeleting={deleteMutation.isPending}
                isRTL={isRTL}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ArchiveItemProps {
  archive: Archive;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isRTL: boolean;
}

function ArchiveItem({
  archive,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
  isRTL,
}: ArchiveItemProps) {
  const youtubeId =
    archive.mediaType === "VIDEO" ? getYouTubeVideoId(archive.mediaUrl) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={onToggle}
      >
        <button
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded ? (
            <Minus className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
        <h3 className="flex-1 font-medium text-gray-900 dark:text-white truncate">
          {archive.title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
            title={isRTL ? "עריכה" : "Edit"}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title={isRTL ? "מחיקה" : "Delete"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-4 space-y-4">
            {/* Media */}
            {archive.mediaType === "IMAGE" && archive.mediaUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={archive.mediaUrl}
                  alt={archive.title}
                  className="w-full max-h-96 object-contain bg-gray-100 dark:bg-gray-900"
                />
              </div>
            )}
            {archive.mediaType === "VIDEO" && youtubeId && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={archive.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none">
              <RichContent content={archive.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

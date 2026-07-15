"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useNotification } from "@/contexts/NotificationContext";
import {
  useIdeas,
  useCreateIdea,
  useUpdateIdea,
  useDeleteIdea,
  type IdeaNote,
} from "@/hooks/useIdeas";
import Modal from "@/components/Modal/Modal";
import TiptapEditor from "@/lib/editor/editor";
import { stripHtml } from "@/lib/utils/stripHtml";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Loader2,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// Sticky-note palette — key stored in DB, classes resolved here so dark
// mode variants stay in one place
const NOTE_COLORS: { key: string | null; card: string; swatch: string }[] = [
  {
    key: null,
    card: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    swatch: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500",
  },
  {
    key: "amber",
    card: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    swatch: "bg-amber-200 border-amber-300",
  },
  {
    key: "blue",
    card: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    swatch: "bg-blue-200 border-blue-300",
  },
  {
    key: "green",
    card: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    swatch: "bg-green-200 border-green-300",
  },
  {
    key: "pink",
    card: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800",
    swatch: "bg-pink-200 border-pink-300",
  },
  {
    key: "purple",
    card: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    swatch: "bg-purple-200 border-purple-300",
  },
];

const cardClassFor = (color: string | null) =>
  (NOTE_COLORS.find((c) => c.key === color) ?? NOTE_COLORS[0]).card;

function IdeaEditor({
  idea,
  onDone,
}: {
  idea: IdeaNote | null;
  onDone: () => void;
}) {
  const { t, locale } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const createIdea = useCreateIdea();
  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();

  const [title, setTitle] = useState(idea?.title ?? "");
  const [content, setContent] = useState(idea?.content ?? "");
  const [color, setColor] = useState<string | null>(idea?.color ?? null);
  const [pinned, setPinned] = useState(idea?.pinned ?? false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const BackArrow = locale === "he" ? ArrowRight : ArrowLeft;
  const saving = createIdea.isPending || updateIdea.isPending;

  const handleSave = async () => {
    if (!title.trim()) {
      showError(t("adminIdeas.titleRequired"));
      return;
    }
    const payload = { title, content, color, pinned };
    try {
      if (idea) {
        await updateIdea.mutateAsync({ id: idea.id, ...payload });
      } else {
        await createIdea.mutateAsync(payload);
      }
      showSuccess(t("adminIdeas.savedSuccess"));
      onDone();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : t("adminIdeas.errorGeneric")
      );
    }
  };

  const handleDelete = async () => {
    if (!idea) return;
    try {
      await deleteIdea.mutateAsync(idea.id);
      showSuccess(t("adminIdeas.deletedSuccess"));
      onDone();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : t("adminIdeas.errorGeneric")
      );
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("adminIdeas.deleteTitle")}
        message={t("adminIdeas.deleteMessage")}
        showCancel
        cancelText={t("adminIdeas.cancel")}
        confirmText={t("adminIdeas.confirmDelete")}
        onConfirm={handleDelete}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDone}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          aria-label={t("adminIdeas.back")}
        >
          <BackArrow className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {idea ? t("adminIdeas.editIdea") : t("adminIdeas.newIdea")}
        </h3>
      </div>

      <div
        className={`rounded-xl border p-6 shadow-sm space-y-4 ${cardClassFor(color)}`}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("adminIdeas.titlePlaceholder")}
          dir="auto"
          className="w-full px-3 py-2.5 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white/70 dark:bg-gray-900/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          autoFocus={!idea}
        />

        <TiptapEditor
          value={content}
          onChange={setContent}
          placeholder={t("adminIdeas.contentPlaceholder")}
          direction={locale === "he" ? "rtl" : "ltr"}
          theme="light"
        />

        <div className="flex flex-wrap items-center gap-4">
          {/* Colors */}
          <div
            className="flex items-center gap-1.5"
            role="group"
            aria-label={t("adminIdeas.color")}
          >
            {NOTE_COLORS.map((c) => (
              <button
                key={c.key ?? "none"}
                type="button"
                onClick={() => setColor(c.key)}
                className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${c.swatch} ${
                  color === c.key ? "ring-2 ring-blue-500 scale-110" : ""
                }`}
                aria-label={c.key ?? "default"}
              />
            ))}
          </div>
          <span className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              pinned
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-pressed={pinned}
          >
            {pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            {t("adminIdeas.pinned")}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {idea && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {t("adminIdeas.delete")}
          </button>
        )}
        <div className="ms-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {t("adminIdeas.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t("adminIdeas.saving") : t("adminIdeas.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IdeasAdmin() {
  const { t } = useTranslation();
  const { showError } = useNotification();
  const { data: ideas, isLoading } = useIdeas();
  const updateIdea = useUpdateIdea();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ idea: IdeaNote | null } | null>(
    null
  );

  const filtered = useMemo(() => {
    if (!ideas) return [];
    const q = search.trim().toLowerCase();
    if (!q) return ideas;
    return ideas.filter(
      (idea) =>
        idea.title.toLowerCase().includes(q) ||
        stripHtml(idea.content || "").toLowerCase().includes(q)
    );
  }, [ideas, search]);

  const togglePin = async (idea: IdeaNote, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateIdea.mutateAsync({ id: idea.id, pinned: !idea.pinned });
    } catch (err) {
      showError(
        err instanceof Error ? err.message : t("adminIdeas.errorGeneric")
      );
    }
  };

  if (editing) {
    return <IdeaEditor idea={editing.idea} onDone={() => setEditing(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("adminIdeas.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("adminIdeas.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ idea: null })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("adminIdeas.newIdea")}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("adminIdeas.searchPlaceholder")}
          dir="auto"
          className="w-full ps-9 pe-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {search ? t("adminIdeas.noResults") : t("adminIdeas.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((idea) => {
            const preview = stripHtml(idea.content || "");
            return (
              <div
                key={idea.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing({ idea })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setEditing({ idea });
                  }
                }}
                className={`relative rounded-xl border p-4 text-start shadow-sm hover:shadow-md transition-shadow cursor-pointer ${cardClassFor(idea.color)}`}
              >
                <button
                  type="button"
                  onClick={(e) => togglePin(idea, e)}
                  className={`absolute top-2.5 end-2.5 p-1.5 rounded-full transition-colors cursor-pointer ${
                    idea.pinned
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
                  }`}
                  title={
                    idea.pinned ? t("adminIdeas.unpin") : t("adminIdeas.pin")
                  }
                  aria-label={
                    idea.pinned ? t("adminIdeas.unpin") : t("adminIdeas.pin")
                  }
                >
                  <Pin
                    className={`w-4 h-4 ${idea.pinned ? "fill-current" : ""}`}
                  />
                </button>
                <h3
                  dir="auto"
                  className="pe-8 font-semibold text-gray-900 dark:text-white line-clamp-2"
                >
                  {idea.title}
                </h3>
                {preview && (
                  <p
                    dir="auto"
                    className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-5 whitespace-pre-wrap"
                  >
                    {preview}
                  </p>
                )}
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(idea.createdAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

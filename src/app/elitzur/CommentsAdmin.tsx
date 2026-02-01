"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import { MessageCircle, User, Calendar, Trash2, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import type { AdminComment } from "@/types/Comments/comments";

export default function CommentsAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showSuccess, showError } = useNotification();

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<AdminComment | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchComments();
    }
  }, [isAuthorized]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/comments");
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (comment: AdminComment) => {
    setCommentToDelete(comment);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCommentToDelete(null);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${commentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      setComments(comments.filter((c) => c.id !== commentToDelete.id));
      if (selectedComment?.id === commentToDelete.id) {
        setSelectedComment(null);
      }
      showSuccess(t("admin.comments.deleteSuccess") || "התגובה נמחקה בהצלחה");
      closeDeleteModal();
    } catch (err) {
      showError(t("admin.comments.deleteError") || "שגיאה במחיקת התגובה");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-sm text-amber-800 dark:text-amber-300">
        <p className="mb-4">
          {t("admin.comments.signInRequired") || "יש להתחבר כדי לצפות בתגובות"}
        </p>
        <LoginForm />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-sm text-red-800 dark:text-red-300">
        <p>{(t("admin.comments.errorLoading") || "שגיאה בטעינת תגובות: {error}").replace("{error}", error)}</p>
        <button
          onClick={fetchComments}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {t("admin.comments.retry") || "נסה שוב"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(t("admin.comments.total") || "סה״כ {count} תגובות").replace("{count}", String(comments.length))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("admin.comments.title") || "תגובות"}</h3>
          {comments.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {t("admin.comments.noComments") || "אין תגובות"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("admin.comments.noCommentsYet") || "עדיין לא התקבלו תגובות"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-xl border bg-white dark:bg-gray-800 p-4 shadow-sm cursor-pointer transition-colors ${
                    selectedComment?.id === comment.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedComment(comment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {comment.user.name || comment.user.email || "משתמש אנונימי"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                          {comment.article.title}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(comment);
                      }}
                      className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t("admin.comments.deleteComment") || "מחק תגובה"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("admin.comments.commentDetails") || "פרטי התגובה"}
          </h3>
          {selectedComment ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("admin.comments.from") || "מאת"}
                  </label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedComment.user.name || "ללא שם"}
                    </p>
                  </div>
                  {selectedComment.user.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mr-6 rtl:mr-0 rtl:ml-6">
                      {selectedComment.user.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("admin.comments.article") || "מאמר"}
                  </label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <Link
                      href={`/articles/${selectedComment.article.slug}`}
                      target="_blank"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {selectedComment.article.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("admin.comments.date") || "תאריך"}
                  </label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedComment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("admin.comments.content") || "תוכן התגובה"}
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedComment.content}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Link
                    href={`/articles/${selectedComment.article.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("admin.comments.viewArticle") || "צפה במאמר"}
                  </Link>
                  <button
                    onClick={() => openDeleteModal(selectedComment)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("admin.common.delete") || "מחק"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {t("admin.comments.noCommentSelected") || "לא נבחרה תגובה"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("admin.comments.selectComment") || "בחר תגובה מהרשימה לצפייה בפרטים"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title={t("admin.comments.deleteTitle") || "מחיקת תגובה"}
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("admin.comments.deleteConfirm") || "האם אתה בטוח?"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {t("admin.comments.deleteWarning") || "אתה עומד למחוק את התגובה של"}
            <span className="font-medium text-gray-900 dark:text-white"> {commentToDelete?.user.name || commentToDelete?.user.email}</span>.
            <br />
            {t("admin.comments.deleteIrreversible") || "פעולה זו אינה ניתנת לביטול."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              {t("admin.common.cancel") || "ביטול"}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("admin.comments.deleting") || "מוחק..."}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("admin.comments.deleteButton") || "מחק תגובה"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

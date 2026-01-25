"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import DragDropImageUpload from "@/components/Upload/upload";
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  Calendar,
} from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useNotifications,
  useCreateNotification,
  useUpdateNotification,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import type { NotificationWithReadCount } from "@/types/Notifications/notifications";

export default function NotificationsAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showSuccess, showError } = useNotification();

  const { data, isLoading, error, refetch } = useNotifications();
  const createNotification = useCreateNotification();
  const updateNotification = useUpdateNotification();
  const deleteNotification = useDeleteNotification();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithReadCount | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(true);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setImageUrl("");
    setPublished(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openEditModal = (notification: NotificationWithReadCount) => {
    setSelectedNotification(notification);
    setTitle(notification.title);
    setMessage(notification.message);
    setImageUrl(notification.imageUrl || "");
    setPublished(notification.published);
    setEditModalOpen(true);
  };

  const openDeleteModal = (notification: NotificationWithReadCount) => {
    setSelectedNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      showError(t("admin.notifications.titleMessageRequired"));
      return;
    }

    try {
      await createNotification.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl || null,
        published,
      });
      showSuccess(t("admin.notifications.createSuccess"));
      setCreateModalOpen(false);
      resetForm();
    } catch {
      showError(t("admin.notifications.createError"));
    }
  };

  const handleUpdate = async () => {
    if (!selectedNotification) return;
    if (!title.trim() || !message.trim()) {
      showError(t("admin.notifications.titleMessageRequired"));
      return;
    }

    try {
      await updateNotification.mutateAsync({
        id: selectedNotification.id,
        data: {
          title: title.trim(),
          message: message.trim(),
          imageUrl: imageUrl || null,
          published,
        },
      });
      showSuccess(t("admin.notifications.updateSuccess"));
      setEditModalOpen(false);
      setSelectedNotification(null);
      resetForm();
    } catch {
      showError(t("admin.notifications.updateError"));
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    try {
      await deleteNotification.mutateAsync(selectedNotification.id);
      showSuccess(t("admin.notifications.deleteSuccess"));
      setDeleteModalOpen(false);
      setSelectedNotification(null);
    } catch {
      showError(t("admin.notifications.deleteError"));
    }
  };

  const togglePublished = async (notification: NotificationWithReadCount) => {
    try {
      await updateNotification.mutateAsync({
        id: notification.id,
        data: { published: !notification.published },
      });
      showSuccess(
        notification.published
          ? t("admin.notifications.unpublished")
          : t("admin.notifications.published")
      );
    } catch {
      showError(t("admin.notifications.updateError"));
    }
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200">
        <p className="mb-4">{t("admin.notifications.signInRequired")}</p>
        <LoginForm />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-6 text-sm text-red-800 dark:text-red-200">
        <p>{t("admin.notifications.errorLoading")}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {t("admin.common.retry")}
        </button>
      </div>
    );
  }

  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t("admin.notifications.total").replace("{count}", String(notifications.length))}
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("admin.notifications.create")}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
          <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t("admin.notifications.noNotifications")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("admin.notifications.createFirst")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {notification.imageUrl && (
                  <img
                    src={notification.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </h4>
                    {notification.published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Eye className="w-3 h-3 mr-1" />
                        {t("admin.notifications.published")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <EyeOff className="w-3 h-3 mr-1" />
                        {t("admin.notifications.draft")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {t("admin.notifications.readBy")
                        .replace("{read}", String(notification.readCount))
                        .replace("{total}", String(notification.totalCount))}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublished(notification)}
                    className={`p-2 rounded-lg transition-colors ${
                      notification.published
                        ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title={notification.published ? t("admin.notifications.unpublish") : t("admin.notifications.publish")}
                  >
                    {notification.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(notification)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title={t("admin.common.edit")}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(notification)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title={t("admin.common.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t("admin.notifications.createTitle")}
        hideFooter
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.notifications.titleLabel")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder={t("admin.notifications.titlePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.notifications.messageLabel")} *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder={t("admin.notifications.messagePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.notifications.imageLabel")}
            </label>
            <DragDropImageUpload
              onImageSelect={(url) => setImageUrl(url || "")}
              currentImage={imageUrl}
              placeholder={t("admin.notifications.imagePlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="create-published" className="text-sm text-gray-700 dark:text-gray-300">
              {t("admin.notifications.publishImmediately")}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t("admin.common.cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={createNotification.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createNotification.isPending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {t("admin.notifications.createButton")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t("admin.notifications.editTitle")}
        hideFooter
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.notifications.titleLabel")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.notifications.messageLabel")} *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("admin.notifications.imageLabel")}
            </label>
            <DragDropImageUpload
              onImageSelect={(url) => setImageUrl(url || "")}
              currentImage={imageUrl}
              placeholder={t("admin.notifications.imagePlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="edit-published" className="text-sm text-gray-700 dark:text-gray-300">
              {t("admin.notifications.isPublished")}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t("admin.common.cancel")}
            </button>
            <button
              onClick={handleUpdate}
              disabled={updateNotification.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updateNotification.isPending && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {t("admin.notifications.saveChanges")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t("admin.notifications.deleteTitle")}
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("admin.notifications.deleteConfirm")}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
            {t("admin.notifications.deleteWarning")}
            <span className="font-medium text-gray-900 dark:text-white"> &quot;{selectedNotification?.title}&quot;</span>.
            <br />
            {t("admin.notifications.deleteIrreversible")}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteNotification.isPending}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              {t("admin.common.cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteNotification.isPending}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {deleteNotification.isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("admin.notifications.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("admin.notifications.deleteButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

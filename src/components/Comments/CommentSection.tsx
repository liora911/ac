"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { ALLOWED_EMAILS } from "@/constants/auth";
import type { Comment, CommentSectionProps } from "@/types/Comments/comments";

// Simple relative time formatter
function getRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isHebrew = locale === "he";

  if (diffMin < 1) {
    return isHebrew ? "עכשיו" : "just now";
  }
  if (diffMin < 60) {
    return isHebrew ? `לפני ${diffMin} דקות` : `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return isHebrew ? `לפני ${diffHour} שעות` : `${diffHour}h ago`;
  }
  if (diffDay < 7) {
    return isHebrew ? `לפני ${diffDay} ימים` : `${diffDay}d ago`;
  }

  // For older dates, show the full date
  return date.toLocaleDateString(isHebrew ? "he-IL" : "en-US", {
    day: "numeric",
    month: "short",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onDelete,
  isDeleting,
  locale,
}: {
  comment: Comment;
  currentUserId?: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const canDelete = isAdmin || comment.userId === currentUserId;
  const displayName = comment.user.name || comment.user.email?.split("@")[0] || "Anonymous";
  const initials = displayName.charAt(0).toUpperCase();

  const handleDelete = () => {
    if (window.confirm(t("comments.deleteConfirm"))) {
      onDelete(comment.id);
    }
  };

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user.image ? (
          <Image
            src={comment.user.image}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {displayName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getRelativeTime(comment.createdAt, locale)}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title={t("comments.delete")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const { t, locale } = useTranslation();
  const [content, setContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: commentsData, isLoading } = useComments(articleId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const isAuthenticated = status === "authenticated" && session?.user;
  const isAdmin = isAuthenticated && session?.user?.email
    ? ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !isAuthenticated) return;

    setSubmitError(null);

    try {
      await createComment.mutateAsync({
        articleId,
        content: content.trim(),
      });
      setContent("");
    } catch (error) {
      if (error instanceof Error) {
        // Check for rate limit error
        if (error.message.includes("once per day")) {
          setSubmitError(t("comments.rateLimited"));
        } else {
          setSubmitError(error.message);
        }
      }
    }
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate({ id: commentId, articleId });
  };

  return (
    <section className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {t("comments.title")}
        {commentsData && commentsData.total > 0 && (
          <span className="ms-2 text-base font-normal text-gray-500">
            ({commentsData.total})
          </span>
        )}
      </h2>

      {/* Comment Form */}
      <div className="mb-6">
        {isAuthenticated ? (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ""}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("comments.placeholder")}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {submitError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {submitError}
                  </p>
                )}
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!content.trim() || createComment.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {createComment.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        {t("comments.submitting")}
                      </span>
                    ) : (
                      t("comments.submit")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {t("comments.loginRequired")}
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {t("comments.loginButton")}
            </Link>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : commentsData && commentsData.comments.length > 0 ? (
          <div>
            {commentsData.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={session?.user?.id}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                isDeleting={deleteComment.isPending}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t("comments.noComments")}
          </p>
        )}
      </div>
    </section>
  );
}

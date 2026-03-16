"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ThumbsUp, X, MessageCircle, Reply } from "lucide-react";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
  useCommentLikers,
  useCommentReplies,
} from "@/hooks/useComments";
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

  return date.toLocaleDateString(isHebrew ? "he-IL" : "en-US", {
    day: "numeric",
    month: "short",
    year: diffDay > 365 ? "numeric" : undefined,
  });
}

function LikersModal({
  commentId,
  onClose,
}: {
  commentId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: likers, isLoading } = useCommentLikers(commentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 max-h-80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {t("comments.likedBy")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : likers && likers.length > 0 ? (
            likers.map((liker) => (
              <div key={liker.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {liker.image ? (
                  <Image
                    src={liker.image}
                    alt={liker.name || ""}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {(liker.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-900 dark:text-white">
                  {liker.name || t("comments.anonymous")}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
              {t("comments.noLikes")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Single reply item inside the RepliesModal
function ReplyItem({
  comment,
  articleId,
  currentUserId,
  isAdmin,
  isAuthenticated,
  onDelete,
  isDeleting,
  locale,
}: {
  comment: Comment;
  articleId: string;
  currentUserId?: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const [showLikers, setShowLikers] = useState(false);
  const toggleLike = useToggleCommentLike();
  const canDelete = isAdmin || comment.userId === currentUserId;
  const displayName = comment.user.name || comment.user.email?.split("@")[0] || "Anonymous";
  const initials = displayName.charAt(0).toUpperCase();

  const handleLike = () => {
    if (!isAuthenticated) return;
    toggleLike.mutate({ commentId: comment.id, articleId });
  };

  return (
    <div className="flex gap-3 py-3">
      <div className="flex-shrink-0">
        {comment.user.image ? (
          <Image
            src={comment.user.image}
            alt={displayName}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white text-xs">
              {displayName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getRelativeTime(comment.createdAt, locale)}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={() => {
                if (window.confirm(t("comments.deleteConfirm"))) onDelete(comment.id);
              }}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title={t("comments.delete")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1 text-xs transition-colors ${
              comment.isLikedByMe
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className={`w-3 h-3 ${comment.isLikedByMe ? "fill-current" : ""}`} />
          </button>
          {comment.likeCount > 0 && (
            <button
              onClick={() => setShowLikers(true)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {comment.likeCount}
            </button>
          )}
        </div>
      </div>
      {showLikers && (
        <LikersModal commentId={comment.id} onClose={() => setShowLikers(false)} />
      )}
    </div>
  );
}

// Modal showing the parent comment + all its replies
function RepliesModal({
  parentComment,
  articleId,
  currentUserId,
  isAdmin,
  isAuthenticated,
  session,
  locale,
  onClose,
}: {
  parentComment: Comment;
  articleId: string;
  currentUserId?: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  session: { user: { name?: string | null; email?: string | null; image?: string | null } } | null;
  locale: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: replies, isLoading } = useCommentReplies(parentComment.id);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [replyContent, setReplyContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !isAuthenticated) return;
    setSubmitError(null);
    try {
      await createComment.mutateAsync({
        articleId,
        content: replyContent.trim(),
        parentId: parentComment.id,
      });
      setReplyContent("");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("once per day")) {
          setSubmitError(t("comments.rateLimited"));
        } else {
          setSubmitError(error.message);
        }
      }
    }
  };

  const handleDeleteReply = (commentId: string) => {
    deleteComment.mutate({ id: commentId, articleId });
  };

  const parentDisplayName = parentComment.user.name || parentComment.user.email?.split("@")[0] || "Anonymous";
  const parentInitials = parentDisplayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            {t("comments.replies")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4">
          {/* Original comment */}
          <div className="flex gap-3 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0">
              {parentComment.user.image ? (
                <Image
                  src={parentComment.user.image}
                  alt={parentDisplayName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {parentInitials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {parentDisplayName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getRelativeTime(parentComment.createdAt, locale)}
                </span>
              </div>
              <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
                {parentComment.content}
              </p>
            </div>
          </div>

          {/* Replies */}
          <div className="ps-6 border-s-2 border-gray-200 dark:border-gray-700 ms-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : replies && replies.length > 0 ? (
              replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  isAuthenticated={isAuthenticated}
                  onDelete={handleDeleteReply}
                  isDeleting={deleteComment.isPending}
                  locale={locale}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                {t("comments.noRepliesYet")}
              </p>
            )}
          </div>
        </div>

        {/* Reply form at the bottom */}
        {isAuthenticated && session ? (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 shrink-0">
            <form onSubmit={handleSubmitReply} className="flex gap-2">
              <div className="flex-shrink-0">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ""}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t("comments.replyPlaceholder")}
                  rows={2}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
                {submitError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{submitError}</p>
                )}
                <div className="mt-1.5 flex justify-end">
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || createComment.isPending}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                  >
                    {createComment.isPending ? t("comments.submitting") : t("comments.reply")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center shrink-0">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t("comments.loginToReply")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  articleId,
  currentUserId,
  isAdmin,
  isAuthenticated,
  session,
  onDelete,
  isDeleting,
  locale,
  onReply,
}: {
  comment: Comment;
  articleId: string;
  currentUserId?: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  session: { user: { name?: string | null; email?: string | null; image?: string | null } } | null;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  locale: string;
  onReply: (comment: Comment) => void;
}) {
  const { t } = useTranslation();
  const [showLikers, setShowLikers] = useState(false);
  const toggleLike = useToggleCommentLike();
  const canDelete = isAdmin || comment.userId === currentUserId;
  const displayName = comment.user.name || comment.user.email?.split("@")[0] || "Anonymous";
  const initials = displayName.charAt(0).toUpperCase();

  const handleDelete = () => {
    if (window.confirm(t("comments.deleteConfirm"))) {
      onDelete(comment.id);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) return;
    toggleLike.mutate({ commentId: comment.id, articleId });
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

        {/* Like + Reply + View Replies */}
        <div className="mt-2 flex items-center gap-3">
          {/* Like button */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.isLikedByMe
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isAuthenticated ? t("comments.like") : t("comments.loginToLike")}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLikedByMe ? "fill-current" : ""}`} />
            </button>
            {comment.likeCount > 0 && (
              <button
                onClick={() => setShowLikers(true)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {comment.likeCount}
              </button>
            )}
          </div>

          {/* Reply button */}
          <button
            onClick={() => onReply(comment)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>{t("comments.reply")}</span>
          </button>

          {/* View Replies button (when there are replies) */}
          {comment.replyCount > 0 && (
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>
                {t("comments.viewReplies")} ({comment.replyCount})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Likers Modal */}
      {showLikers && (
        <LikersModal
          commentId={comment.id}
          onClose={() => setShowLikers(false)}
        />
      )}
    </div>
  );
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const { t, locale } = useTranslation();
  const [content, setContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [repliesFor, setRepliesFor] = useState<Comment | null>(null);

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
              href="/auth/login"
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
                articleId={articleId}
                currentUserId={session?.user?.id}
                isAdmin={isAdmin}
                isAuthenticated={!!isAuthenticated}
                session={session}
                onDelete={handleDelete}
                isDeleting={deleteComment.isPending}
                locale={locale}
                onReply={setRepliesFor}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t("comments.noComments")}
          </p>
        )}
      </div>

      {/* Replies Modal */}
      {repliesFor && (
        <RepliesModal
          parentComment={repliesFor}
          articleId={articleId}
          currentUserId={session?.user?.id}
          isAdmin={isAdmin}
          isAuthenticated={!!isAuthenticated}
          session={session}
          locale={locale}
          onClose={() => setRepliesFor(null)}
        />
      )}
    </section>
  );
}

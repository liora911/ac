// Comment author info (subset of User)
export interface CommentAuthor {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// Comment from database with author info
export interface Comment {
  id: string;
  content: string;
  articleId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: CommentAuthor;
}

// Article info for admin comment view
export interface CommentArticle {
  id: string;
  title: string;
  slug: string;
}

// Comment with article info (for admin view)
export interface AdminComment extends Comment {
  article: CommentArticle;
}

// Request body for creating a comment
export interface CreateCommentRequest {
  articleId: string;
  content: string;
}

// Response for GET /api/articles/[id]/comments
export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

// Response for checking if user can comment today
export interface CanCommentResponse {
  canComment: boolean;
  reason?: string;
}

// Props for comment components
export interface CommentSectionProps {
  articleId: string;
}

export interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export interface CommentFormProps {
  articleId: string;
  onSuccess: () => void;
}

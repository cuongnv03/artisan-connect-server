import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../models/Comment';

export interface ICommentService {
  /**
   * Create a comment
   */
  createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser>;

  /**
   * Update a comment
   */
  updateComment(id: string, userId: string, data: UpdateCommentDto): Promise<CommentWithUser>;

  /**
   * Delete a comment
   */
  deleteComment(id: string, userId: string): Promise<boolean>;

  /**
   * Get comment by ID
   */
  getCommentById(id: string, requestUserId?: string): Promise<CommentWithUser | null>;

  /**
   * Get post comments
   */
  getPostComments(
    postId: string,
    options?: Omit<CommentQueryOptions, 'postId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;

  /**
   * Get comment replies
   */
  getCommentReplies(
    commentId: string,
    options?: Omit<CommentQueryOptions, 'postId' | 'parentId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;

  /**
   * Get user's comments
   */
  getUserComments(
    userId: string,
    options?: Omit<CommentQueryOptions, 'userId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;
}

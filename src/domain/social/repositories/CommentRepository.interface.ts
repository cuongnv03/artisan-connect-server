import { BaseRepository } from '../../repositories/BaseRepository';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../entities/Comment';

export interface ICommentRepository extends BaseRepository<Comment, string> {
  /**
   * Find comment by ID with user details
   */
  findByIdWithUser(id: string, requestUserId?: string): Promise<CommentWithUser | null>;

  /**
   * Create a comment
   */
  createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser>;

  /**
   * Update a comment
   */
  updateComment(id: string, userId: string, data: UpdateCommentDto): Promise<CommentWithUser>;

  /**
   * Delete a comment (soft delete)
   */
  deleteComment(id: string, userId: string): Promise<boolean>;

  /**
   * Get comments
   */
  getComments(
    options: CommentQueryOptions,
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
   * Increment comment reply count
   */
  incrementReplyCount(commentId: string): Promise<void>;

  /**
   * Decrement comment reply count
   */
  decrementReplyCount(commentId: string): Promise<void>;

  /**
   * Check if comment belongs to user
   */
  isCommentOwner(id: string, userId: string): Promise<boolean>;
}

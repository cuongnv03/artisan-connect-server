import { BaseRepository } from '../../repositories/BaseRepository';
import { Like, LikeWithUser, LikePaginationResult, ReactionType } from '../entities/Like';

export interface ILikeRepository extends BaseRepository<Like, string> {
  /**
   * Create a like
   */
  createLike(
    userId: string,
    data: { postId?: string; commentId?: string; reaction?: ReactionType },
  ): Promise<Like>;

  /**
   * Delete a like
   */
  deleteLike(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;

  /**
   * Get like by user and post or comment
   */
  getLike(userId: string, data: { postId?: string; commentId?: string }): Promise<Like | null>;

  /**
   * Check if user has liked
   */
  hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;

  /**
   * Get likes for a post
   */
  getPostLikes(postId: string, page?: number, limit?: number): Promise<LikePaginationResult>;

  /**
   * Get likes for a comment
   */
  getCommentLikes(commentId: string, page?: number, limit?: number): Promise<LikePaginationResult>;

  /**
   * Get likes count
   */
  getLikesCount(data: { postId?: string; commentId?: string }): Promise<number>;
}

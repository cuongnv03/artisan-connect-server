import {
  Like,
  LikeWithUser,
  ReactionType,
  LikePaginationResult,
} from '../../../domain/social/entities/Like';

export interface ILikeService {
  /**
   * Toggle like on a post or comment
   */
  toggleLike(
    userId: string,
    data: { postId?: string; commentId?: string; reaction?: ReactionType },
  ): Promise<boolean>;

  /**
   * Like a post or comment
   */
  addLike(
    userId: string,
    data: { postId?: string; commentId?: string; reaction?: ReactionType },
  ): Promise<Like>;

  /**
   * Unlike a post or comment
   */
  removeLike(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;

  /**
   * Check if user has liked post or comment
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
   * Get like count for post or comment
   */
  getLikeCount(data: { postId?: string; commentId?: string }): Promise<number>;
}

import {
  SavedPost,
  SavedPostWithDetails,
  SavedPostPaginationResult,
} from '../../../domain/social/entities/SavedPost';

export interface ISavedPostService {
  /**
   * Save a post
   */
  savePost(userId: string, postId: string): Promise<SavedPost>;

  /**
   * Unsave a post
   */
  unsavePost(userId: string, postId: string): Promise<boolean>;

  /**
   * Toggle saved status
   */
  toggleSavePost(userId: string, postId: string): Promise<boolean>;

  /**
   * Check if user has saved a post
   */
  hasSaved(userId: string, postId: string): Promise<boolean>;

  /**
   * Get saved posts for a user
   */
  getSavedPosts(userId: string, page?: number, limit?: number): Promise<SavedPostPaginationResult>;
}

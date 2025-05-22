import { SavedPost, SavedPostWithDetails, SavedPostPaginationResult } from '../models/SavedPost';

export interface ISavedPostService {
  savePost(userId: string, postId: string): Promise<SavedPost>;
  unsavePost(userId: string, postId: string): Promise<boolean>;
  toggleSavePost(userId: string, postId: string): Promise<boolean>;
  hasSaved(userId: string, postId: string): Promise<boolean>;
  getSavedPosts(userId: string, page?: number, limit?: number): Promise<SavedPostPaginationResult>;
}

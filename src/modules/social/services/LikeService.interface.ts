import { Like, LikeWithUser, LikePaginationResult } from '../models/Like';

export interface ILikeService {
  toggleLike(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;
  addLike(userId: string, data: { postId?: string; commentId?: string }): Promise<Like>;
  removeLike(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;
  hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;
  getPostLikes(postId: string, page?: number, limit?: number): Promise<LikePaginationResult>;
  getCommentLikes(commentId: string, page?: number, limit?: number): Promise<LikePaginationResult>;
  getLikeCount(data: { postId?: string; commentId?: string }): Promise<number>;
}

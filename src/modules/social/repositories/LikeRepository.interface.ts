import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Like, LikeWithUser, LikePaginationResult } from '../models/Like';

export interface ILikeRepository extends BaseRepository<Like, string> {
  createLike(userId: string, data: { postId?: string; commentId?: string }): Promise<Like>;
  deleteLike(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;
  getLike(userId: string, data: { postId?: string; commentId?: string }): Promise<Like | null>;
  hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean>;
  getPostLikes(postId: string, page?: number, limit?: number): Promise<LikePaginationResult>;
  getCommentLikes(commentId: string, page?: number, limit?: number): Promise<LikePaginationResult>;
  getLikesCount(data: { postId?: string; commentId?: string }): Promise<number>;
}

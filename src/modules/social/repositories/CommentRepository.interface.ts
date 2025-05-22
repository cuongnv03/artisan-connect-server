import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../models/Comment';

export interface ICommentRepository extends BaseRepository<Comment, string> {
  findByIdWithUser(id: string, requestUserId?: string): Promise<CommentWithUser | null>;
  createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser>;
  updateComment(id: string, userId: string, data: UpdateCommentDto): Promise<CommentWithUser>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  getComments(
    options: CommentQueryOptions,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;
  getCommentReplies(
    commentId: string,
    options?: Omit<CommentQueryOptions, 'postId' | 'parentId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;
  isCommentOwner(id: string, userId: string): Promise<boolean>;
}

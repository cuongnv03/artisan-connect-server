import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../models/Comment';

export interface ICommentService {
  createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser>;
  updateComment(id: string, userId: string, data: UpdateCommentDto): Promise<CommentWithUser>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  getCommentById(id: string, requestUserId?: string): Promise<CommentWithUser | null>;
  getPostComments(
    postId: string,
    options?: Omit<CommentQueryOptions, 'postId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;
  getCommentReplies(
    commentId: string,
    options?: Omit<CommentQueryOptions, 'postId' | 'parentId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;
  getUserComments(
    userId: string,
    options?: Omit<CommentQueryOptions, 'userId'>,
    requestUserId?: string,
  ): Promise<CommentPaginationResult>;
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICommentService } from '../../../services/CommentService.interface';
import container from '../../../../../core/di/container';

export class GetPostCommentsController extends BaseController {
  private commentService: ICommentService;

  constructor() {
    super();
    this.commentService = container.resolve<ICommentService>('commentService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const { parentId, page, limit, includeReplies, sortBy, sortOrder } = req.query;

      const comments = await this.commentService.getPostComments(
        postId,
        {
          parentId: parentId === 'null' ? null : (parentId as string),
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 10,
          includeReplies: includeReplies === 'true',
          includeLikeStatus: !!req.user,
          sortBy: (sortBy as any) || 'createdAt',
          sortOrder: (sortOrder as any) || 'desc',
        },
        req.user?.id,
      );

      ApiResponse.success(res, comments, 'Post comments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

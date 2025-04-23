import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICommentService } from '../../../../application/services/social/CommentService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class GetCommentRepliesController extends BaseController {
  private commentService: ICommentService;

  constructor() {
    super();
    this.commentService = container.resolve<ICommentService>('commentService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const replies = await this.commentService.getCommentReplies(
        commentId,
        {
          page,
          limit,
          includeLikeStatus: !!req.user,
        },
        req.user?.id,
      );

      ApiResponse.success(res, replies, 'Comment replies retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

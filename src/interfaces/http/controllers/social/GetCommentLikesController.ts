import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ILikeService } from '../../../../application/services/social/LikeService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class GetCommentLikesController extends BaseController {
  private likeService: ILikeService;

  constructor() {
    super();
    this.likeService = container.resolve<ILikeService>('likeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const likes = await this.likeService.getCommentLikes(commentId, page, limit);

      ApiResponse.success(res, likes, 'Comment likes retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

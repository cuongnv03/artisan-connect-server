import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ILikeService } from '../../services/LikeService.interface';
import container from '../../../../core/di/container';

export class ToggleLikeController extends BaseController {
  private likeService: ILikeService;

  constructor() {
    super();
    this.likeService = container.resolve<ILikeService>('likeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { postId, commentId, reaction } = req.body;
      const isLiked = await this.likeService.toggleLike(req.user!.id, {
        postId,
        commentId,
        reaction,
      });

      ApiResponse.success(
        res,
        { liked: isLiked },
        isLiked ? 'Liked successfully' : 'Unliked successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}

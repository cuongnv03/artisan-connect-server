import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ILikeService } from '../../../../application/services/social/LikeService.interface';
import container from '../../../../di/container';

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

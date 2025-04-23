import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IFollowService } from '../../../../application/services/social/FollowService.interface';
import container from '../../../../di/container';

export class FollowUserController extends BaseController {
  private followService: IFollowService;

  constructor() {
    super();
    this.followService = container.resolve<IFollowService>('followService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { followingId, notifyNewPosts } = req.body;
      const follow = await this.followService.followUser(req.user!.id, followingId, notifyNewPosts);

      ApiResponse.success(res, follow, 'User followed successfully');
    } catch (error) {
      next(error);
    }
  }
}

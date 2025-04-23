import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IFollowService } from '../../../../application/services/social/FollowService.interface';
import container from '../../../../di/container';

export class GetFollowingController extends BaseController {
  private followService: IFollowService;

  constructor() {
    super();
    this.followService = container.resolve<IFollowService>('followService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as any;

      const following = await this.followService.getFollowing(userId, {
        page,
        limit,
        status,
      });

      ApiResponse.success(res, following, 'Following retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

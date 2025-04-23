import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IFollowService } from '../../../../application/services/social/FollowService.interface';
import container from '../../../../di/container';

export class GetFollowStatusController extends BaseController {
  private followService: IFollowService;

  constructor() {
    super();
    this.followService = container.resolve<IFollowService>('followService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { userId } = req.params;
      const isFollowing = await this.followService.isFollowing(req.user!.id, userId);
      const followDetails = isFollowing
        ? await this.followService.getFollowDetails(req.user!.id, userId)
        : null;

      ApiResponse.success(
        res,
        {
          following: isFollowing,
          details: followDetails,
        },
        'Follow status retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}

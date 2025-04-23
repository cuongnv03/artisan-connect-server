import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IFollowService } from '../../../../application/services/social/FollowService.interface';
import container from '../../../../di/container';

export class UnfollowUserController extends BaseController {
  private followService: IFollowService;

  constructor() {
    super();
    this.followService = container.resolve<IFollowService>('followService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { userId } = req.params;
      await this.followService.unfollowUser(req.user!.id, userId);

      ApiResponse.success(res, null, 'User unfollowed successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import container from '../../../../../core/di/container';

export class GetSuggestedArtisansController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const limit = parseInt(req.query.limit as string) || 5;
      const userId = req.user!.id;

      // Validate limit
      if (limit > 20) {
        return ApiResponse.badRequest(res, 'Limit cannot exceed 20');
      }

      const suggestions = await this.artisanProfileService.getSuggestedArtisans(userId, limit);

      ApiResponse.success(
        res,
        suggestions,
        "Suggested artisans you haven't followed retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

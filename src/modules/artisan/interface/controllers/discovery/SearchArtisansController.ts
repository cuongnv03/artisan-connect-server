import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import { ArtisanSearchFilters } from '../../../models/ArtisanProfile';
import container from '../../../../../core/di/container';

export class SearchArtisansController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: ArtisanSearchFilters = {
        search: req.query.search as string,
        specialties: req.query.specialties
          ? (req.query.specialties as string).split(',')
          : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        isVerified: req.query.isVerified ? req.query.isVerified === 'true' : undefined,
        location: req.query.location as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await this.artisanProfileService.searchArtisans(filters, page, limit);

      ApiResponse.success(res, result, 'Artisans retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

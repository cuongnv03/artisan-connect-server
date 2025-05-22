import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../services/ArtisanProfileService.interface';
import { PaginationUtils } from '../../../../shared/utils/PaginationUtils';
import container from '../../../../core/di/container';

export class GetArtisansController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get pagination parameters
      const { page, limit } = PaginationUtils.normalizePaginationParams(
        Number(req.query.page),
        Number(req.query.limit),
      );

      // Get filter parameters
      const filters: Record<string, any> = {};
      if (req.query.search) filters.search = req.query.search;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query.specialties) filters.specialties = req.query.specialties;
      if (req.query.isVerified) filters.isVerified = req.query.isVerified === 'true';

      // Get sorting parameters
      if (req.query.sortBy) filters.sortBy = req.query.sortBy;
      if (req.query.sortOrder) filters.sortOrder = req.query.sortOrder;

      // Get artisan profiles with pagination
      const artisanProfiles = await this.artisanProfileService.getArtisanProfilesWithPagination(
        page,
        limit,
        filters,
      );

      ApiResponse.success(res, artisanProfiles, 'Artisans retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

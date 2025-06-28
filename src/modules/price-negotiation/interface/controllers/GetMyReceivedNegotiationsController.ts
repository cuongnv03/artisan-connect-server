import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import container from '../../../../core/di/container';
import { AppError } from '../../../../core/errors/AppError';

export class GetMyReceivedNegotiationsController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    // Only artisans can view received negotiations
    if (req.user!.role !== 'ARTISAN') {
      throw new AppError('Only artisans can view received negotiations', 403, 'FORBIDDEN');
    }

    const userId = req.user!.id;
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      productId: req.query.productId as string,
      variantId: req.query.variantId as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (req.query.dateFrom) {
      options.dateFrom = new Date(req.query.dateFrom as string);
    }

    if (req.query.dateTo) {
      options.dateTo = new Date(req.query.dateTo as string);
    }

    // Get negotiations received by current user (where they are the artisan)
    const negotiations = await this.negotiationService.getArtisanNegotiations(userId, options);

    ApiResponse.success(res, negotiations, 'My received price negotiations retrieved successfully');
  }
}

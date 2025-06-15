import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import { NegotiationQueryOptions } from '../../models/PriceNegotiation';
import container from '../../../../core/di/container';

export class GetMyNegotiationsController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const options: Partial<NegotiationQueryOptions> = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      productId: req.query.productId as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (req.query.dateFrom) {
      options.dateFrom = new Date(req.query.dateFrom as string);
    }

    if (req.query.dateTo) {
      options.dateTo = new Date(req.query.dateTo as string);
    }

    const negotiations = await this.negotiationService.getMyNegotiations(
      req.user!.id,
      req.user!.role,
      options,
    );

    const roleMessage = {
      CUSTOMER: 'My price negotiations retrieved successfully',
      ARTISAN: 'My received price negotiations retrieved successfully',
      ADMIN: 'All price negotiations retrieved successfully',
    };

    ApiResponse.success(
      res,
      negotiations,
      roleMessage[req.user!.role as keyof typeof roleMessage] ||
        'Price negotiations retrieved successfully',
    );
  }
}

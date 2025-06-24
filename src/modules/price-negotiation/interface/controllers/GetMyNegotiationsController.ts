import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import { NegotiationQueryOptions } from '../../models/PriceNegotiation';
import container from '../../../../core/di/container';
import { AppError } from '../../../../core/errors/AppError';

export class GetMyNegotiationsController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { type } = req.query; // NEW: Get type parameter

    const options: Partial<NegotiationQueryOptions> = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      productId: req.query.productId as string,
      variantId: req.query.variantId as string, // NEW
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (req.query.dateFrom) {
      options.dateFrom = new Date(req.query.dateFrom as string);
    }

    if (req.query.dateTo) {
      options.dateTo = new Date(req.query.dateTo as string);
    }

    // NEW: Handle type parameter for explicit sent/received
    let negotiations;
    let roleMessage: string;

    if (type === 'sent') {
      // Get negotiations sent by current user (where they are the customer)
      negotiations = await this.negotiationService.getCustomerNegotiations(req.user!.id, options);
      roleMessage = 'My sent price negotiations retrieved successfully';
    } else if (type === 'received') {
      // Get negotiations received by current user (where they are the artisan)
      if (req.user!.role !== 'ARTISAN') {
        throw new AppError('Only artisans can view received negotiations', 403, 'FORBIDDEN');
      }
      negotiations = await this.negotiationService.getArtisanNegotiations(req.user!.id, options);
      roleMessage = 'My received price negotiations retrieved successfully';
    } else {
      // Default behavior (backward compatibility)
      negotiations = await this.negotiationService.getMyNegotiations(
        req.user!.id,
        req.user!.role,
        options,
      );

      const defaultRoleMessage = {
        CUSTOMER: 'My price negotiations retrieved successfully',
        ARTISAN: 'My received price negotiations retrieved successfully',
        ADMIN: 'All price negotiations retrieved successfully',
      };

      roleMessage =
        defaultRoleMessage[req.user!.role as keyof typeof defaultRoleMessage] ||
        'Price negotiations retrieved successfully';
    }

    ApiResponse.success(res, negotiations, roleMessage);
  }
}

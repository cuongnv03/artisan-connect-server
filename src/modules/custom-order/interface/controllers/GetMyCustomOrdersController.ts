import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICustomOrderService } from '../../services/CustomOrderService.interface';
import { CustomOrderQueryOptions } from '../../models/CustomOrder';
import container from '../../../../core/di/container';

export class GetMyCustomOrdersController extends BaseController {
  private customOrderService: ICustomOrderService;

  constructor() {
    super();
    this.customOrderService = container.resolve<ICustomOrderService>('customOrderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const options: Partial<CustomOrderQueryOptions> = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (req.query.dateFrom) {
      options.dateFrom = new Date(req.query.dateFrom as string);
    }

    if (req.query.dateTo) {
      options.dateTo = new Date(req.query.dateTo as string);
    }

    const customOrders = await this.customOrderService.getMyCustomOrders(
      req.user!.id,
      req.user!.role,
      options,
    );

    const roleMessage = {
      CUSTOMER: 'My custom order requests retrieved successfully',
      ARTISAN: 'My received custom order requests retrieved successfully',
      ADMIN: 'All custom order requests retrieved successfully',
    };

    ApiResponse.success(
      res,
      customOrders,
      roleMessage[req.user!.role] || 'Custom orders retrieved successfully',
    );
  }
}

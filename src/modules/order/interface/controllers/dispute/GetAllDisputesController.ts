import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderRepository } from '../../../repositories/OrderRepository.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetAllDisputesController extends BaseController {
  private orderRepository: IOrderRepository;

  constructor() {
    super();
    this.orderRepository = container.resolve<IOrderRepository>('orderRepository');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);
    this.validateRole(req, ['ADMIN']);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      type: req.query.type as any,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    };

    const disputes = await this.orderRepository.getDisputes(options);

    ApiResponse.success(res, disputes, 'All disputes retrieved successfully');
  }
}

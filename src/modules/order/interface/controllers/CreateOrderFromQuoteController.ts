import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../services/OrderService.interface';
import container from '../../../../core/di/container';

export class CreateOrderFromQuoteController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const order = await this.orderService.createOrderFromQuote(req.user!.id, req.body);

    ApiResponse.created(res, order, 'Order created successfully from quote');
  }
}

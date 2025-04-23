import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../../application/services/order/OrderService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class UpdateShippingInfoController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Ensure user is an artisan
      if (req.user!.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans can update shipping information');
      }

      const { id } = req.params;
      const updatedOrder = await this.orderService.updateShippingInfo(id, req.user!.id, req.body);

      ApiResponse.success(res, updatedOrder, 'Shipping information updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

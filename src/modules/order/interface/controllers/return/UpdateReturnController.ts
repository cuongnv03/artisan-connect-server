import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import container from '../../../../../core/di/container';

export class UpdateReturnController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;
    const returnRequest = await this.orderService.updateReturn(id, req.body, req.user!.id);

    ApiResponse.success(res, returnRequest, 'Return request updated successfully');
  }
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import container from '../../../../../core/di/container';

export class UpdateDisputeController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;
    const dispute = await this.orderService.updateDispute(id, req.body, req.user!.id);

    ApiResponse.success(res, dispute, 'Dispute updated successfully');
  }
}

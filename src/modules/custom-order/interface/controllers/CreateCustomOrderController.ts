import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICustomOrderService } from '../../services/CustomOrderService.interface';
import container from '../../../../core/di/container';

export class CreateCustomOrderController extends BaseController {
  private customOrderService: ICustomOrderService;

  constructor() {
    super();
    this.customOrderService = container.resolve<ICustomOrderService>('customOrderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const customOrder = await this.customOrderService.createCustomOrder(req.user!.id, req.body);

    ApiResponse.created(res, customOrder, 'Custom order request created successfully');
  }
}

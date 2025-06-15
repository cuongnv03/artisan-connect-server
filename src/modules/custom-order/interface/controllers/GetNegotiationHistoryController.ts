import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICustomOrderService } from '../../services/CustomOrderService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetNegotiationHistoryController extends BaseController {
  private customOrderService: ICustomOrderService;

  constructor() {
    super();
    this.customOrderService = container.resolve<ICustomOrderService>('customOrderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;

    // Validate access
    const hasAccess = await this.customOrderService.validateOrderAccess(id, req.user!.id);
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this negotiation history');
    }

    const history = await this.customOrderService.getNegotiationHistory(id);

    ApiResponse.success(res, history, 'Negotiation history retrieved successfully');
  }
}

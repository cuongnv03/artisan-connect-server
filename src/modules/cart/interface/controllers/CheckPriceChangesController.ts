import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class CheckPriceChangesController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const priceChanges = await this.cartService.checkPriceChanges(req.user!.id);

      const message =
        priceChanges.length > 0
          ? `Found ${priceChanges.length} price changes`
          : 'No price changes detected';

      ApiResponse.success(res, { priceChanges }, message);
    } catch (error) {
      next(error);
    }
  }
}

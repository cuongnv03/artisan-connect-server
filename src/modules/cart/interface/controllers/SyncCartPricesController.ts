import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class SyncCartPricesController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const syncResult = await this.cartService.syncCartPrices(req.user!.id);

      const message =
        syncResult.updatedItems > 0
          ? `Synced prices for ${syncResult.updatedItems} items`
          : 'All prices are up to date';

      ApiResponse.success(res, syncResult, message);
    } catch (error) {
      next(error);
    }
  }
}

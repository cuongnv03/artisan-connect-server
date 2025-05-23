import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class OptimizeCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const optimization = await this.cartService.optimizeCart(req.user!.id);

      const message =
        optimization.removedItems.length > 0 || optimization.updatedItems.length > 0
          ? 'Cart optimized successfully'
          : 'Cart is already optimized';

      ApiResponse.success(res, optimization, message);
    } catch (error) {
      next(error);
    }
  }
}

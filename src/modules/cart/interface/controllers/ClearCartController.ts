import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class ClearCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const result = await this.cartService.clearCart(req.user!.id);

      if (result) {
        ApiResponse.success(res, null, 'Cart cleared successfully');
      } else {
        ApiResponse.badRequest(res, 'Failed to clear cart');
      }
    } catch (error) {
      next(error);
    }
  }
}

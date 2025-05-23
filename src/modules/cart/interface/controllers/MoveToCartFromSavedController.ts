import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class MoveToCartFromSavedController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { productId } = req.params;
      const { quantity = 1 } = req.body;

      const cartItem = await this.cartService.moveToCartFromSaved(
        req.user!.id,
        productId,
        quantity,
      );

      ApiResponse.success(res, cartItem, 'Item moved to cart successfully');
    } catch (error) {
      next(error);
    }
  }
}

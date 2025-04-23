import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../../../application/services/cart/CartService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class UpdateCartItemController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { productId } = req.params;
      const cartItem = await this.cartService.updateCartItemQuantity(
        req.user!.id,
        productId,
        req.body,
      );

      ApiResponse.success(res, cartItem, 'Cart item updated successfully');
    } catch (error) {
      // Special case for item removed (when quantity is set to 0)
      if (error instanceof AppError && error.statusCode === 200) {
        ApiResponse.success(res, null, error.message);
        return;
      }
      next(error);
    }
  }
}

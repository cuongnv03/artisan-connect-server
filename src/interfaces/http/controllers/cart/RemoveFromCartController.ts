import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../../../application/services/cart/CartService.interface';
import container from '../../../../di/container';

export class RemoveFromCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { productId } = req.params;
      await this.cartService.removeFromCart(req.user!.id, productId);

      ApiResponse.success(res, null, 'Item removed from cart successfully');
    } catch (error) {
      next(error);
    }
  }
}

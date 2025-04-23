import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../../../application/services/cart/CartService.interface';
import container from '../../../../di/container';

export class AddToCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const cartItem = await this.cartService.addToCart(req.user!.id, req.body);

      ApiResponse.success(res, cartItem, 'Item added to cart successfully');
    } catch (error) {
      next(error);
    }
  }
}

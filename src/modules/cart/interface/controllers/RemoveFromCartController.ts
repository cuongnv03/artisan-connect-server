import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class RemoveFromCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { productId } = req.params;
    const result = await this.cartService.removeFromCart(req.user!.id, productId);

    if (result) {
      ApiResponse.success(res, null, 'Item removed from cart successfully');
    } else {
      ApiResponse.notFound(res, 'Item not found in cart');
    }
  }
}

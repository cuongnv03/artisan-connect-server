import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class UpdateCartItemController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { productId } = req.params;
    const { variantId } = req.query;

    const cartItem = await this.cartService.updateCartItem(
      req.user!.id,
      productId,
      req.body,
      variantId as string | undefined,
    );

    ApiResponse.success(res, cartItem, 'Cart item updated successfully');
  }
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class AddNegotiatedItemToCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { negotiationId } = req.params;
    const { quantity } = req.body;

    const cartItem = await this.cartService.addNegotiatedItemToCart(
      req.user!.id,
      negotiationId,
      quantity,
    );

    ApiResponse.success(res, cartItem, 'Item added to cart with negotiated price successfully');
  }
}

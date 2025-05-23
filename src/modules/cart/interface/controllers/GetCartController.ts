import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class GetCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const includeDetails = req.query.details === 'true';

      if (includeDetails) {
        const cartSummary = await this.cartService.getCartSummary(req.user!.id);
        ApiResponse.success(res, cartSummary, 'Cart summary retrieved successfully');
      } else {
        const cartItems = await this.cartService.getCartItems(req.user!.id);
        ApiResponse.success(res, { items: cartItems }, 'Cart items retrieved successfully');
      }
    } catch (error) {
      next(error);
    }
  }
}

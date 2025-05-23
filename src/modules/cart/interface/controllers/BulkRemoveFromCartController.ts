import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class BulkRemoveFromCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { productIds } = req.body;
      const result = await this.cartService.bulkRemoveFromCart(req.user!.id, productIds);

      if (result) {
        ApiResponse.success(res, null, 'Items removed from cart successfully');
      } else {
        ApiResponse.badRequest(res, 'Failed to remove items from cart');
      }
    } catch (error) {
      next(error);
    }
  }
}

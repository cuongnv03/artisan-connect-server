import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class BulkUpdateCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const updatedItems = await this.cartService.bulkUpdateCart(req.user!.id, req.body);

      ApiResponse.success(res, updatedItems, 'Cart items updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

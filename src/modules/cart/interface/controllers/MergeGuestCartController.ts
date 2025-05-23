import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class MergeGuestCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const mergeResult = await this.cartService.mergeGuestCart(req.user!.id, req.body);

      const message =
        mergeResult.skippedItems.length > 0
          ? `Cart merged successfully. ${mergeResult.skippedItems.length} items were skipped.`
          : 'Guest cart merged successfully';

      ApiResponse.success(res, mergeResult, message);
    } catch (error) {
      next(error);
    }
  }
}

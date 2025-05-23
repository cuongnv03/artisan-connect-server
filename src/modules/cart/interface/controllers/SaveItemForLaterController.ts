import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class SaveItemForLaterController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { productId } = req.params;
      const result = await this.cartService.saveItemForLater(req.user!.id, productId);

      if (result) {
        ApiResponse.success(res, null, 'Item saved for later successfully');
      } else {
        ApiResponse.badRequest(res, 'Failed to save item for later');
      }
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class ValidateCartController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const validationResult = await this.cartService.validateCartForCheckout(req.user!.id);

      if (!validationResult.valid) {
        ApiResponse.badRequest(res, validationResult.message || 'Cart validation failed');
        return;
      }

      ApiResponse.success(res, { valid: true }, 'Cart is valid for checkout');
    } catch (error) {
      next(error);
    }
  }
}

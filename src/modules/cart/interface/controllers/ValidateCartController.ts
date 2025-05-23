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

      const validationType = (req.query.type as string) || 'basic';

      if (validationType === 'checkout') {
        const validation = await this.cartService.validateForCheckout(req.user!.id);

        if (validation.isValid) {
          ApiResponse.success(res, validation, 'Cart is valid for checkout');
        } else {
          ApiResponse.badRequest(
            res,
            validation.errors.join(', ') || 'Cart validation failed',
            'CART_VALIDATION_FAILED',
          );
        }
      } else {
        const validation = await this.cartService.validateCart(req.user!.id);

        ApiResponse.success(res, validation, 'Cart validation completed');
      }
    } catch (error) {
      next(error);
    }
  }
}

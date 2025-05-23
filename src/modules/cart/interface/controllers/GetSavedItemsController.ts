import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICartService } from '../../services/CartService.interface';
import container from '../../../../core/di/container';

export class GetSavedItemsController extends BaseController {
  private cartService: ICartService;

  constructor() {
    super();
    this.cartService = container.resolve<ICartService>('cartService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const savedItems = await this.cartService.getSavedItems(req.user!.id);

      ApiResponse.success(res, { items: savedItems }, 'Saved items retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

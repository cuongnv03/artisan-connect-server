import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IWishlistService } from '../../../services/WishlistService.interface';
import container from '../../../../../core/di/container';

export class GetWishlistController extends BaseController {
  private wishlistService: IWishlistService;

  constructor() {
    super();
    this.wishlistService = container.resolve<IWishlistService>('wishlistService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const itemType = req.query.itemType as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const wishlistItems = await this.wishlistService.getWishlistItems(
        req.user!.id,
        itemType,
        page,
        limit,
      );

      ApiResponse.success(res, wishlistItems, 'Wishlist retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IWishlistService } from '../../../services/WishlistService.interface';
import container from '../../../../../core/di/container';

export class RemoveFromWishlistController extends BaseController {
  private wishlistService: IWishlistService;

  constructor() {
    super();
    this.wishlistService = container.resolve<IWishlistService>('wishlistService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { itemType, itemId } = req.params;
      const result = await this.wishlistService.removeFromWishlist(
        req.user!.id,
        itemType as any,
        itemId,
      );

      if (result) {
        ApiResponse.success(res, null, 'Item removed from wishlist successfully');
      } else {
        ApiResponse.success(res, null, 'Item was not in wishlist');
      }
    } catch (error) {
      next(error);
    }
  }
}

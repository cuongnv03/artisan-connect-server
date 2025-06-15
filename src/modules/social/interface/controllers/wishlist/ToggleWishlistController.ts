import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IWishlistService } from '../../../services/WishlistService.interface';
import container from '../../../../../core/di/container';

export class ToggleWishlistController extends BaseController {
  private wishlistService: IWishlistService;

  constructor() {
    super();
    this.wishlistService = container.resolve<IWishlistService>('wishlistService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { itemType, productId, postId } = req.body;
      const itemId = itemType === 'PRODUCT' ? productId : postId;

      const isInWishlist = await this.wishlistService.toggleWishlistItem(
        req.user!.id,
        itemType,
        itemId,
      );

      ApiResponse.success(res, {
        inWishlist: isInWishlist,
        message: isInWishlist ? 'Item added to wishlist' : 'Item removed from wishlist',
      });
    } catch (error) {
      next(error);
    }
  }
}

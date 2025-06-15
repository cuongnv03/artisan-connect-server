import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IWishlistService } from '../../../services/WishlistService.interface';
import container from '../../../../../core/di/container';

export class CheckWishlistStatusController extends BaseController {
  private wishlistService: IWishlistService;

  constructor() {
    super();
    this.wishlistService = container.resolve<IWishlistService>('wishlistService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { itemType, itemId } = req.params;
      const inWishlist = await this.wishlistService.hasInWishlist(
        req.user!.id,
        itemType as any,
        itemId,
      );

      ApiResponse.success(res, { inWishlist }, 'Wishlist status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

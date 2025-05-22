import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetDefaultAddressController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const address = await this.userService.getDefaultAddress(req.user!.id);

      if (!address) {
        throw AppError.notFound('No default address found');
      }

      ApiResponse.success(res, address, 'Default address retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

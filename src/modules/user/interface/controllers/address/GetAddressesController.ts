import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import container from '../../../../../core/di/container';

export class GetAddressesController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const addresses = await this.userService.getAddressesByUserId(req.user!.id);

      ApiResponse.success(res, addresses, 'Addresses retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

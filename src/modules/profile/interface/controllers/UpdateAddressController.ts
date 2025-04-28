import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IProfileService } from '../../services/ProfileService.interface';
import container from '../../../../core/di/container';

export class UpdateAddressController extends BaseController {
  private profileService: IProfileService;

  constructor() {
    super();
    this.profileService = container.resolve<IProfileService>('profileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const address = await this.profileService.updateAddress(id, req.user!.id, req.body);

      ApiResponse.success(res, address, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

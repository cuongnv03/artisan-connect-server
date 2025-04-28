import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISystemConfigService } from '../../services/SystemConfigService.interface';
import container from '../../../../core/di/container';

export class CreateConfigController extends BaseController {
  private systemConfigService: ISystemConfigService;

  constructor() {
    super();
    this.systemConfigService = container.resolve<ISystemConfigService>('systemConfigService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate admin privileges
      this.validateRole(req, ['ADMIN']);

      const config = await this.systemConfigService.createConfig(req.body, req.user!.id);

      ApiResponse.created(res, config, 'Config created successfully');
    } catch (error) {
      next(error);
    }
  }
}

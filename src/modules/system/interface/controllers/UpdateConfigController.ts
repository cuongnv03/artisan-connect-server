import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISystemConfigService } from '../../services/SystemConfigService.interface';
import container from '../../../../core/di/container';

export class UpdateConfigController extends BaseController {
  private systemConfigService: ISystemConfigService;

  constructor() {
    super();
    this.systemConfigService = container.resolve<ISystemConfigService>('systemConfigService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate admin privileges
      this.validateRole(req, ['ADMIN']);

      const { key } = req.params;
      const config = await this.systemConfigService.updateConfig(key, req.body, req.user!.id);

      ApiResponse.success(res, config, 'Config updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

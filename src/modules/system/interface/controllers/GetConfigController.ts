import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISystemConfigService } from '../../services/SystemConfigService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetConfigController extends BaseController {
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
      const config = await this.systemConfigService.getConfig(key);

      if (!config) {
        throw AppError.notFound(`Config "${key}" not found`);
      }

      ApiResponse.success(res, config, 'Config retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

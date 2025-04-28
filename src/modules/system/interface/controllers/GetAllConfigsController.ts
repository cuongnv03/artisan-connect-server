import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISystemConfigService } from '../../services/SystemConfigService.interface';
import container from '../../../../core/di/container';

export class GetAllConfigsController extends BaseController {
  private systemConfigService: ISystemConfigService;

  constructor() {
    super();
    this.systemConfigService = container.resolve<ISystemConfigService>('systemConfigService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate admin privileges
      this.validateRole(req, ['ADMIN']);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const configs = await this.systemConfigService.getAllConfigs({
        page,
        limit,
        search,
      });

      ApiResponse.success(res, configs, 'Configs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

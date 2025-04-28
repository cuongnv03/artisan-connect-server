import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISystemConfigService } from '../../services/SystemConfigService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetConfigValueController extends BaseController {
  private systemConfigService: ISystemConfigService;

  constructor() {
    super();
    this.systemConfigService = container.resolve<ISystemConfigService>('systemConfigService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      let defaultValue: any = undefined;

      // Check if default value is provided
      if (req.query.default !== undefined) {
        defaultValue = req.query.default;
        // Try to parse as JSON if possible
        try {
          defaultValue = JSON.parse(defaultValue as string);
        } catch (e) {
          // If parsing fails, use as is (string)
        }
      }

      const value = await this.systemConfigService.getValue(key, defaultValue);

      ApiResponse.success(res, { value }, 'Config value retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

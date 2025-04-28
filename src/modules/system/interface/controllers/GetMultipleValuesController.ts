import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISystemConfigService } from '../../services/SystemConfigService.interface';
import container from '../../../../core/di/container';

export class GetMultipleValuesController extends BaseController {
  private systemConfigService: ISystemConfigService;

  constructor() {
    super();
    this.systemConfigService = container.resolve<ISystemConfigService>('systemConfigService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { keys } = req.body;
      const values = await this.systemConfigService.getMultipleValues(keys);

      ApiResponse.success(res, values, 'Config values retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

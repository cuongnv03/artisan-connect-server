import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import container from '../../../../../core/di/container';

export class MarkAsReadController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const result = await this.messageService.markAsRead(id, req.user!.id);

      if (result) {
        ApiResponse.success(res, null, 'Message marked as read');
      } else {
        ApiResponse.notFound(res, 'Message not found or already read');
      }
    } catch (error) {
      next(error);
    }
  }
}

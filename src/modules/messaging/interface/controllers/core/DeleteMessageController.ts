import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import container from '../../../../../core/di/container';

export class DeleteMessageController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const result = await this.messageService.deleteMessage(id, req.user!.id);

      if (result) {
        ApiResponse.success(res, null, 'Message deleted successfully');
      } else {
        ApiResponse.notFound(res, 'Message not found or you cannot delete this message');
      }
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../services/MessageService.interface';
import container from '../../../../core/di/container';

export class SendMediaMessageController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { receiverId, mediaUrl, mediaType, content } = req.body;

      const message = await this.messageService.sendMediaMessage(
        req.user!.id,
        receiverId,
        mediaUrl,
        mediaType,
        content,
      );

      ApiResponse.created(res, message, 'Media message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}

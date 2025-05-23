import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import { CustomOrderNegotiationService } from '../../../services/CustomOrderNegotiationService';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class SendCustomOrderController extends BaseController {
  private messageService: IMessageService;
  private customOrderService: CustomOrderNegotiationService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
    this.customOrderService = container.resolve<CustomOrderNegotiationService>(
      'customOrderNegotiationService',
    );
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { type, ...requestData } = req.body;

      // Route based on message type
      switch (type) {
        case 'proposal':
          return await this.sendProposal(req, res, requestData);
        case 'response':
          return await this.sendResponse(req, res, requestData);
        case 'simple_message':
          return await this.sendSimpleMessage(req, res, requestData);
        default:
          throw AppError.badRequest('Invalid custom order message type');
      }
    } catch (error) {
      next(error);
    }
  }

  private async sendProposal(req: Request, res: Response, data: any): Promise<void> {
    const { artisanId, proposal } = data;

    const result = await this.customOrderService.sendCustomOrderProposal(
      req.user!.id,
      artisanId,
      proposal,
    );

    ApiResponse.created(res, result, 'Custom order proposal sent successfully');
  }

  private async sendResponse(req: Request, res: Response, data: any): Promise<void> {
    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can respond to custom orders');
    }

    const { customerId, originalMessageId, response } = data;

    const result = await this.customOrderService.respondToCustomOrder(
      req.user!.id,
      customerId,
      originalMessageId,
      response,
    );

    ApiResponse.success(res, result, 'Custom order response sent successfully');
  }

  private async sendSimpleMessage(req: Request, res: Response, data: any): Promise<void> {
    const { receiverId, content, orderData } = data;

    const message = await this.messageService.sendCustomOrderMessage(
      req.user!.id,
      receiverId,
      orderData,
      content,
    );

    ApiResponse.created(res, message, 'Custom order message sent successfully');
  }
}

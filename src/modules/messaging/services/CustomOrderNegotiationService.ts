import { IMessageService } from './MessageService.interface';
import { IQuoteService } from '../../quote/services/QuoteService.interface';
import { INotificationService } from '../../notification/services/NotificationService.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export interface CustomOrderProposal {
  productName: string;
  description: string;
  estimatedPrice: number;
  estimatedDuration: string;
  specifications: Record<string, any>;
  images?: string[];
}

export interface CustomOrderResponse {
  accepted: boolean;
  counterOffer?: {
    price: number;
    duration: string;
    modifications: string;
  };
  message: string;
}

export class CustomOrderNegotiationService {
  private messageService: IMessageService;
  private quoteService: IQuoteService;
  private notificationService: INotificationService;
  private logger = Logger.getInstance();

  constructor() {
    this.messageService = container.resolve<IMessageService>('messageService');
    this.quoteService = container.resolve<IQuoteService>('quoteService');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  async sendCustomOrderProposal(
    customerId: string,
    artisanId: string,
    proposal: CustomOrderProposal,
  ): Promise<any> {
    try {
      // Create a formatted message for the proposal
      const proposalMessage = this.formatCustomOrderProposal(proposal);

      // Send message with custom order type
      const message = await this.messageService.sendCustomOrderMessage(
        customerId,
        artisanId,
        {
          type: 'custom_order_proposal',
          proposal,
          status: 'pending',
        },
        proposalMessage,
      );

      // Send notification to artisan
      await this.notificationService.sendNotification({
        recipientId: artisanId,
        senderId: customerId,
        type: 'CUSTOM_ORDER',
        title: 'New Custom Order Request',
        message: `You have received a custom order request for "${proposal.productName}"`,
        data: {
          messageId: message.id,
          proposal,
        },
      });

      this.logger.info(`Custom order proposal sent from ${customerId} to ${artisanId}`);

      return {
        message,
        proposal,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error(`Error sending custom order proposal: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send custom order proposal', 500, 'SERVICE_ERROR');
    }
  }

  async respondToCustomOrder(
    artisanId: string,
    customerId: string,
    originalMessageId: string,
    response: CustomOrderResponse,
  ): Promise<any> {
    try {
      // Validate access to original message
      const hasAccess = await this.messageService.validateMessageAccess(
        originalMessageId,
        artisanId,
      );
      if (!hasAccess) {
        throw new AppError('You do not have access to this custom order', 403, 'ACCESS_DENIED');
      }

      // Create response message
      const responseMessage = this.formatCustomOrderResponse(response);

      const message = await this.messageService.sendCustomOrderMessage(
        artisanId,
        customerId,
        {
          type: 'custom_order_response',
          originalMessageId,
          response,
          status: response.accepted ? 'accepted' : 'negotiating',
        },
        responseMessage,
      );

      // If accepted, create a quote request automatically
      if (response.accepted) {
        // This would integrate with the quote system
        const quote = await this.createQuoteFromCustomOrder(originalMessageId, response);
      }

      // Send notification to customer
      const notificationTitle = response.accepted
        ? 'Custom Order Accepted'
        : 'Custom Order Response';

      const notificationMessage = response.accepted
        ? 'Your custom order request has been accepted!'
        : 'The artisan has responded to your custom order request';

      await this.notificationService.sendNotification({
        recipientId: customerId,
        senderId: artisanId,
        type: 'CUSTOM_ORDER',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          messageId: message.id,
          response,
          originalMessageId,
        },
      });

      this.logger.info(`Custom order response sent from ${artisanId} to ${customerId}`);

      return {
        message,
        response,
        status: response.accepted ? 'accepted' : 'negotiating',
      };
    } catch (error) {
      this.logger.error(`Error responding to custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to custom order', 500, 'SERVICE_ERROR');
    }
  }

  async createQuoteFromCustomOrder(
    customerId: string,
    artisanId: string,
    orderData: any,
  ): Promise<any> {
    try {
      // This would create a quote request based on the negotiated custom order
      // For now, we'll return a placeholder

      const quoteData = {
        productId: 'custom', // Special ID for custom products
        customerId,
        artisanId,
        requestedPrice: orderData.estimatedPrice,
        specifications: JSON.stringify(orderData),
        message: `Custom order for: ${orderData.productName}`,
      };

      // This would call the quote service to create a formal quote
      // const quote = await this.quoteService.createQuoteRequest(customerId, quoteData);

      return {
        status: 'quote_created',
        // quote,
        message: 'Formal quote created from custom order negotiation',
      };
    } catch (error) {
      this.logger.error(`Error creating quote from custom order: ${error}`);
      throw new AppError('Failed to create quote from custom order', 500, 'SERVICE_ERROR');
    }
  }

  private formatCustomOrderProposal(proposal: CustomOrderProposal): string {
    return `🛠️ **Custom Order Request**

**Product:** ${proposal.productName}

**Description:** ${proposal.description}

**Estimated Price:** $${proposal.estimatedPrice}

**Timeline:** ${proposal.estimatedDuration}

${proposal.specifications ? `**Specifications:**\n${JSON.stringify(proposal.specifications, null, 2)}` : ''}

Would you be interested in creating this custom piece for me?`;
  }

  private formatCustomOrderResponse(response: CustomOrderResponse): string {
    if (response.accepted) {
      return `✅ **Custom Order Accepted**

${response.message}

I'd be happy to create this custom piece for you! Let's proceed with the details.`;
    } else {
      let message = `💬 **Custom Order Response**

${response.message}`;

      if (response.counterOffer) {
        message += `

**Counter Offer:**
- **Price:** $${response.counterOffer.price}
- **Timeline:** ${response.counterOffer.duration}
- **Modifications:** ${response.counterOffer.modifications}`;
      }

      return message;
    }
  }
}

import { IMessageService } from './MessageService.interface';
import { IQuoteService } from '../../custom-order/services/CustomOrderService.interface';
import { INotificationService } from '../../notification/services/NotificationService.interface';
import { IProductService } from '../../product/services/ProductService.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IMessageRepository } from '../repositories/MessageRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { MessageTemplateService } from './MessageTemplateService';
import { MessageType } from '../models/Message';
import container from '../../../core/di/container';

export interface CustomOrderProposal {
  productName: string;
  description: string;
  estimatedPrice: number;
  estimatedDuration: string;
  specifications: Record<string, any>;
  images?: string[];
  deadline?: Date;
  materials?: string[];
  dimensions?: string;
  colorPreferences?: string[];
  attachments?: string[];
}

export interface CustomOrderResponse {
  accepted: boolean;
  counterOffer?: {
    price: number;
    duration: string;
    modifications: string;
    conditions?: string[];
  };
  message: string;
  canProceed?: boolean;
  requiresMoreInfo?: boolean;
  additionalQuestions?: string[];
}

export interface NegotiationStatus {
  id: string;
  status: 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'cancelled' | 'finalized';
  customerId: string;
  artisanId: string;
  originalProposal: CustomOrderProposal;
  latestOffer?: CustomOrderResponse;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  quoteId?: string;
  orderId?: string;
}

export class CustomOrderNegotiationService {
  private messageService: IMessageService;
  private messageRepository: IMessageRepository;
  private quoteService: IQuoteService;
  private notificationService: INotificationService;
  private productService: IProductService;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  // Cache for daily custom order counts
  private dailyOrderCounts = new Map<string, { date: string; count: number }>();

  constructor() {
    this.messageService = container.resolve<IMessageService>('messageService');
    this.messageRepository = container.resolve<IMessageRepository>('messageRepository');
    this.quoteService = container.resolve<IQuoteService>('quoteService');
    this.notificationService = container.resolve<INotificationService>('notificationService');
    this.productService = container.resolve<IProductService>('productService');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  async sendCustomOrderProposal(
    customerId: string,
    artisanId: string,
    proposal: CustomOrderProposal,
  ): Promise<any> {
    try {
      // Validate users exist and roles
      await this.validateUsers(customerId, artisanId);

      // Validate proposal data
      this.validateProposal(proposal);

      // Check if customer can send custom orders
      const canSend = await this.canSendCustomOrder(customerId, artisanId);
      if (!canSend) {
        throw new AppError(
          'You cannot send custom orders to this artisan',
          403,
          'CUSTOM_ORDER_FORBIDDEN',
        );
      }

      // Generate unique negotiation ID
      const negotiationId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create a formatted message for the proposal
      const proposalMessage = this.formatCustomOrderProposal(proposal);

      // Send message with custom order type
      const message = await this.messageService.sendCustomOrderMessage(
        customerId,
        artisanId,
        {
          type: 'custom_order_proposal',
          negotiationId,
          proposal,
          status: 'pending',
          timestamp: new Date(),
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
          negotiationId,
          proposal,
          estimatedValue: proposal.estimatedPrice,
        },
      });

      this.logger.info(
        `Custom order proposal sent: ${negotiationId} from ${customerId} to ${artisanId}`,
      );

      return {
        negotiationId,
        message,
        proposal,
        status: 'pending',
        canEdit: true,
        expiresAt: this.calculateProposalExpiry(),
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

      // Validate response data
      this.validateResponse(response);

      // Get original proposal from message metadata
      const originalMessage = await this.getMessageWithMetadata(originalMessageId);
      if (!originalMessage || !originalMessage.metadata?.proposal) {
        throw new AppError('Original proposal not found', 404, 'PROPOSAL_NOT_FOUND');
      }

      const negotiationId = originalMessage.metadata.negotiationId;
      const status = this.determineNegotiationStatus(response);

      // Create response message
      const responseMessage = this.formatCustomOrderResponse(response);

      const message = await this.messageService.sendCustomOrderMessage(
        artisanId,
        customerId,
        {
          type: 'custom_order_response',
          negotiationId,
          originalMessageId,
          response,
          status,
          timestamp: new Date(),
        },
        responseMessage,
      );

      // Handle different response types
      let additionalData = {};

      if (response.accepted && response.canProceed) {
        // Create formal quote if accepted
        additionalData = await this.createQuoteFromCustomOrder(
          negotiationId,
          customerId,
          artisanId,
          originalMessage.metadata.proposal,
          response,
        );
      }

      // Send notification to customer
      const notificationData = this.buildResponseNotification(response, negotiationId);

      await this.notificationService.sendNotification({
        recipientId: customerId,
        senderId: artisanId,
        type: 'CUSTOM_ORDER',
        title: notificationData.title,
        message: notificationData.message,
        data: {
          messageId: message.id,
          negotiationId,
          response,
          originalMessageId,
          ...additionalData,
        },
      });

      this.logger.info(
        `Custom order response sent: ${negotiationId} from ${artisanId} to ${customerId}`,
      );

      return {
        negotiationId,
        message,
        response,
        status,
        ...additionalData,
      };
    } catch (error) {
      this.logger.error(`Error responding to custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to custom order', 500, 'SERVICE_ERROR');
    }
  }

  async createQuoteFromCustomOrder(
    negotiationId: string,
    customerId: string,
    artisanId: string,
    proposal: CustomOrderProposal,
    response: CustomOrderResponse,
  ): Promise<any> {
    try {
      // Create a virtual product for custom order
      const customProduct = await this.createVirtualCustomProduct(proposal, artisanId);

      // Determine final price from negotiation
      const finalPrice = response.counterOffer?.price || proposal.estimatedPrice;

      // Create quote request
      const quoteData = {
        productId: customProduct.id,
        requestedPrice: finalPrice,
        specifications: JSON.stringify({
          ...proposal.specifications,
          originalProposal: proposal,
          negotiationId,
          customOrder: true,
          agreedTerms: response.counterOffer || {},
        }),
        message: `Custom order quote for: ${proposal.productName}`,
        expiresInDays: 7, // Quote expires in 7 days
      };

      const quote = await this.quoteService.createQuoteRequest(customerId, quoteData);

      // Auto-accept the quote since it's already negotiated
      if (response.accepted && response.canProceed) {
        const acceptanceData = {
          action: 'ACCEPT',
          message: 'Accepting custom order quote as negotiated',
        };

        await this.quoteService.respondToQuote(quote.id, artisanId, acceptanceData);
      }

      this.logger.info(
        `Quote created from custom order negotiation: ${negotiationId} -> ${quote.id}`,
      );

      return {
        quoteCreated: true,
        quoteId: quote.id,
        customProductId: customProduct.id,
        finalPrice,
        status: 'quote_created',
        message: 'Formal quote created from custom order negotiation',
      };
    } catch (error) {
      this.logger.error(`Error creating quote from custom order: ${error}`);
      throw new AppError('Failed to create quote from custom order', 500, 'QUOTE_CREATION_ERROR');
    }
  }

  async getNegotiationHistory(negotiationId: string, userId: string): Promise<any[]> {
    try {
      // Get all messages related to this negotiation
      const messages = await this.getMessagesByNegotiation(negotiationId, userId);

      return messages.map((message) => ({
        id: message.id,
        type: message.metadata?.type || 'unknown',
        content: message.content,
        sender: {
          id: message.sender.id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
          role: message.sender.role,
        },
        timestamp: message.createdAt,
        metadata: message.metadata,
      }));
    } catch (error) {
      this.logger.error(`Error getting negotiation history: ${error}`);
      throw new AppError('Failed to get negotiation history', 500, 'SERVICE_ERROR');
    }
  }

  async cancelNegotiation(
    negotiationId: string,
    userId: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      // Find the negotiation messages
      const messages = await this.getMessagesByNegotiation(negotiationId, userId);

      if (messages.length === 0) {
        throw new AppError('Negotiation not found', 404, 'NEGOTIATION_NOT_FOUND');
      }

      // Get the other party
      const firstMessage = messages[0];
      const otherUserId =
        firstMessage.senderId === userId ? firstMessage.receiverId : firstMessage.senderId;

      // Send cancellation message
      const cancellationMessage = reason
        ? `🚫 **Custom Order Cancelled**\n\nReason: ${reason}`
        : '🚫 **Custom Order Cancelled**\n\nThis custom order request has been cancelled.';

      await this.messageService.sendCustomOrderMessage(
        userId,
        otherUserId,
        {
          type: 'custom_order_cancellation',
          negotiationId,
          reason,
          status: 'cancelled',
          timestamp: new Date(),
        },
        cancellationMessage,
      );

      // Send notification
      await this.notificationService.sendNotification({
        recipientId: otherUserId,
        senderId: userId,
        type: 'CUSTOM_ORDER',
        title: 'Custom Order Cancelled',
        message: 'A custom order negotiation has been cancelled',
        data: {
          negotiationId,
          reason,
        },
      });

      this.logger.info(`Custom order negotiation cancelled: ${negotiationId} by ${userId}`);

      return true;
    } catch (error) {
      this.logger.error(`Error cancelling negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel negotiation', 500, 'SERVICE_ERROR');
    }
  }

  async updateProposal(
    customerId: string,
    negotiationId: string,
    updatedProposal: Partial<CustomOrderProposal>,
  ): Promise<any> {
    try {
      // Get original proposal
      const originalMessage = await this.getOriginalProposal(negotiationId, customerId);
      if (!originalMessage) {
        throw new AppError('Original proposal not found', 404, 'PROPOSAL_NOT_FOUND');
      }

      // Merge with updates
      const newProposal = {
        ...originalMessage.metadata.proposal,
        ...updatedProposal,
      };

      // Validate updated proposal
      this.validateProposal(newProposal);

      // Get artisan ID
      const artisanId = originalMessage.receiverId;

      // Send updated proposal
      const updateMessage = this.formatProposalUpdate(updatedProposal);

      const message = await this.messageService.sendCustomOrderMessage(
        customerId,
        artisanId,
        {
          type: 'custom_order_update',
          negotiationId,
          updatedProposal: newProposal,
          updates: updatedProposal,
          status: 'updated',
          timestamp: new Date(),
        },
        updateMessage,
      );

      // Send notification
      await this.notificationService.sendNotification({
        recipientId: artisanId,
        senderId: customerId,
        type: 'CUSTOM_ORDER',
        title: 'Custom Order Updated',
        message: 'A custom order proposal has been updated',
        data: {
          messageId: message.id,
          negotiationId,
          updates: updatedProposal,
        },
      });

      return {
        negotiationId,
        message,
        updatedProposal: newProposal,
        status: 'updated',
      };
    } catch (error) {
      this.logger.error(`Error updating proposal: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update proposal', 500, 'SERVICE_ERROR');
    }
  }

  async getActiveNegotiations(
    userId: string,
    role: 'customer' | 'artisan',
  ): Promise<NegotiationStatus[]> {
    try {
      // Get active negotiation messages
      const messages = await this.getActiveNegotiationMessages(userId, role);

      // Group by negotiation ID and get latest status
      const negotiations = new Map<string, NegotiationStatus>();

      for (const message of messages) {
        const negotiationId = message.metadata?.negotiationId;
        if (!negotiationId) continue;

        if (!negotiations.has(negotiationId)) {
          negotiations.set(negotiationId, {
            id: negotiationId,
            status: this.extractStatus(message.metadata),
            customerId: role === 'customer' ? userId : message.senderId,
            artisanId: role === 'artisan' ? userId : message.receiverId,
            originalProposal: this.extractOriginalProposal(message.metadata),
            latestOffer: this.extractLatestOffer(message.metadata),
            messageCount: 0,
            createdAt: message.createdAt,
            updatedAt: message.createdAt,
            quoteId: message.metadata?.quoteId,
            orderId: message.metadata?.orderId,
          });
        }

        const negotiation = negotiations.get(negotiationId)!;
        negotiation.messageCount++;
        negotiation.updatedAt = message.createdAt;

        // Update with latest data
        if (message.metadata?.response) {
          negotiation.latestOffer = message.metadata.response;
        }
      }

      return Array.from(negotiations.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    } catch (error) {
      this.logger.error(`Error getting active negotiations: ${error}`);
      throw new AppError('Failed to get active negotiations', 500, 'SERVICE_ERROR');
    }
  }

  // Private helper methods
  private async validateUsers(customerId: string, artisanId: string): Promise<void> {
    const [customer, artisan] = await Promise.all([
      this.userRepository.findById(customerId),
      this.userRepository.findById(artisanId),
    ]);

    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    if (!artisan) {
      throw new AppError('Artisan not found', 404, 'ARTISAN_NOT_FOUND');
    }

    if (artisan.role !== 'ARTISAN') {
      throw new AppError('Target user is not an artisan', 400, 'NOT_ARTISAN');
    }

    if (customer.id === artisan.id) {
      throw new AppError('Cannot send custom order to yourself', 400, 'SELF_ORDER');
    }
  }

  private validateProposal(proposal: CustomOrderProposal): void {
    if (!proposal.productName || proposal.productName.trim().length === 0) {
      throw new AppError('Product name is required', 400, 'INVALID_PRODUCT_NAME');
    }

    if (proposal.productName.length > 200) {
      throw new AppError('Product name cannot exceed 200 characters', 400, 'PRODUCT_NAME_TOO_LONG');
    }

    if (!proposal.description || proposal.description.trim().length === 0) {
      throw new AppError('Description is required', 400, 'INVALID_DESCRIPTION');
    }

    if (proposal.description.length > 2000) {
      throw new AppError('Description cannot exceed 2000 characters', 400, 'DESCRIPTION_TOO_LONG');
    }

    if (proposal.estimatedPrice <= 0) {
      throw new AppError('Estimated price must be greater than 0', 400, 'INVALID_PRICE');
    }

    if (proposal.estimatedPrice > 50000000) {
      throw new AppError('Estimated price cannot exceed $50,000', 400, 'PRICE_TOO_HIGH');
    }

    if (!proposal.estimatedDuration || proposal.estimatedDuration.trim().length === 0) {
      throw new AppError('Estimated duration is required', 400, 'INVALID_DURATION');
    }

    if (proposal.deadline && proposal.deadline < new Date()) {
      throw new AppError('Deadline cannot be in the past', 400, 'INVALID_DEADLINE');
    }
  }

  private validateResponse(response: CustomOrderResponse): void {
    if (!response.message || response.message.trim().length === 0) {
      throw new AppError('Response message is required', 400, 'INVALID_MESSAGE');
    }

    if (response.message.length > 2000) {
      throw new AppError('Response message cannot exceed 2000 characters', 400, 'MESSAGE_TOO_LONG');
    }

    if (response.counterOffer) {
      if (response.counterOffer.price <= 0) {
        throw new AppError(
          'Counter offer price must be greater than 0',
          400,
          'INVALID_COUNTER_PRICE',
        );
      }

      if (!response.counterOffer.duration || response.counterOffer.duration.trim().length === 0) {
        throw new AppError('Counter offer duration is required', 400, 'INVALID_COUNTER_DURATION');
      }
    }
  }

  private async canSendCustomOrder(customerId: string, artisanId: string): Promise<boolean> {
    try {
      // Check if users can communicate
      const canMessage = await this.messageService.canSendMessageTo(customerId, artisanId);
      if (!canMessage) {
        return false;
      }

      // Check daily limit for custom orders (prevent spam)
      const dailyLimit = 10; // Maximum 10 custom orders per day
      const today = new Date().toISOString().split('T')[0];

      // Check cache first
      const cacheKey = `${customerId}_${today}`;
      const cached = this.dailyOrderCounts.get(cacheKey);

      let count = 0;
      if (cached && cached.date === today) {
        count = cached.count;
      } else {
        // Query database for today's custom order count
        count = await this.getCustomOrderCountForToday(customerId);
        this.dailyOrderCounts.set(cacheKey, { date: today, count });
      }

      if (count >= dailyLimit) {
        this.logger.warn(
          `Custom order daily limit exceeded for user ${customerId}: ${count}/${dailyLimit}`,
        );
        return false;
      }

      // Increment count in cache
      this.dailyOrderCounts.set(cacheKey, { date: today, count: count + 1 });

      return true;
    } catch (error) {
      this.logger.error(`Error checking custom order permission: ${error}`);
      return false;
    }
  }

  private async getCustomOrderCountForToday(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Count messages with custom order type sent today
      const options = {
        page: 1,
        limit: 1000, // Get all for counting
        type: MessageType.CUSTOM_ORDER,
        dateFrom: today,
        dateTo: tomorrow,
      };

      const result = await this.messageRepository.getMessages(options, userId);

      // Filter by custom order proposals only (not responses)
      const customOrderProposals = result.data.filter(
        (message) =>
          message.senderId === userId && message.metadata?.type === 'custom_order_proposal',
      );

      return customOrderProposals.length;
    } catch (error) {
      this.logger.error(`Error counting custom orders for today: ${error}`);
      return 0;
    }
  }

  private async createVirtualCustomProduct(
    proposal: CustomOrderProposal,
    artisanId: string,
  ): Promise<any> {
    try {
      // Create a virtual product for the custom order
      const productData = {
        name: `Custom: ${proposal.productName}`,
        description: proposal.description,
        price: proposal.estimatedPrice,
        quantity: 1,
        isCustomizable: true,
        status: 'DRAFT',
        images: proposal.images || [],
        tags: ['custom-order', 'negotiated'],
        categories: [], // Custom orders might not have categories
      };

      return await this.productService.createProduct(artisanId, productData);
    } catch (error) {
      this.logger.error(`Error creating virtual custom product: ${error}`);
      throw new AppError('Failed to create custom product', 500, 'PRODUCT_CREATION_ERROR');
    }
  }

  private determineNegotiationStatus(response: CustomOrderResponse): string {
    if (response.accepted && response.canProceed) {
      return 'accepted';
    } else if (response.accepted && !response.canProceed) {
      return 'accepted_pending';
    } else if (response.counterOffer) {
      return 'negotiating';
    } else {
      return 'rejected';
    }
  }

  private buildResponseNotification(response: CustomOrderResponse, negotiationId: string): any {
    if (response.accepted) {
      return {
        title: 'Custom Order Accepted',
        message: response.canProceed
          ? 'Your custom order request has been accepted! A formal quote will be created.'
          : 'Your custom order request has been accepted! The artisan will provide more details soon.',
      };
    } else if (response.counterOffer) {
      return {
        title: 'Custom Order Counter Offer',
        message: `The artisan has made a counter offer: $${response.counterOffer.price}`,
      };
    } else {
      return {
        title: 'Custom Order Response',
        message: 'The artisan has responded to your custom order request',
      };
    }
  }

  private calculateProposalExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // Proposals expire in 7 days
    return expiry;
  }

  // Fully implemented message retrieval methods
  private async getMessageWithMetadata(messageId: string): Promise<any> {
    try {
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        return null;
      }

      return {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error getting message with metadata: ${error}`);
      return null;
    }
  }

  private async getMessagesByNegotiation(negotiationId: string, userId: string): Promise<any[]> {
    try {
      // Get messages where user is either sender or receiver and metadata contains negotiationId
      const options = {
        page: 1,
        limit: 1000, // Get all messages for this negotiation
        type: MessageType.CUSTOM_ORDER,
      };

      const result = await this.messageRepository.getMessages(options, userId);

      // Filter by negotiation ID in metadata
      const negotiationMessages = result.data.filter(
        (message) => message.metadata?.negotiationId === negotiationId,
      );

      return negotiationMessages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } catch (error) {
      this.logger.error(`Error getting messages by negotiation: ${error}`);
      return [];
    }
  }

  private async getOriginalProposal(negotiationId: string, customerId: string): Promise<any> {
    try {
      const options = {
        page: 1,
        limit: 100,
        type: MessageType.CUSTOM_ORDER,
      };

      const result = await this.messageRepository.getMessages(options, customerId);

      // Find the original proposal message
      const originalMessage = result.data.find(
        (message) =>
          message.senderId === customerId &&
          message.metadata?.negotiationId === negotiationId &&
          message.metadata?.type === 'custom_order_proposal',
      );

      return originalMessage || null;
    } catch (error) {
      this.logger.error(`Error getting original proposal: ${error}`);
      return null;
    }
  }

  private async getActiveNegotiationMessages(userId: string, role: string): Promise<any[]> {
    try {
      // Get recent custom order messages
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const options = {
        page: 1,
        limit: 1000,
        type: MessageType.CUSTOM_ORDER,
        dateFrom: thirtyDaysAgo,
      };

      const result = await this.messageRepository.getMessages(options, userId);

      // Filter active negotiations (not cancelled or finalized)
      const activeMessages = result.data.filter((message) => {
        const status = message.metadata?.status;
        return status && !['cancelled', 'finalized', 'rejected'].includes(status);
      });

      return activeMessages;
    } catch (error) {
      this.logger.error(`Error getting active negotiation messages: ${error}`);
      return [];
    }
  }

  private extractStatus(
    metadata: any,
  ): 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'cancelled' | 'finalized' {
    return metadata?.status || 'pending';
  }

  private extractOriginalProposal(metadata: any): CustomOrderProposal {
    return (
      metadata?.proposal ||
      metadata?.originalProposal || {
        productName: 'Unknown',
        description: 'No description available',
        estimatedPrice: 0,
        estimatedDuration: 'Unknown',
        specifications: {},
      }
    );
  }

  private extractLatestOffer(metadata: any): CustomOrderResponse | undefined {
    return metadata?.response || metadata?.latestOffer;
  }

  // Message formatting methods
  private formatCustomOrderProposal(proposal: CustomOrderProposal): string {
    let message = `🛠️ **Custom Order Request**

**Product:** ${proposal.productName}

**Description:** ${proposal.description}

**Estimated Price:** $${proposal.estimatedPrice}

**Timeline:** ${proposal.estimatedDuration}`;

    if (proposal.deadline) {
      message += `\n**Deadline:** ${proposal.deadline.toLocaleDateString()}`;
    }

    if (proposal.materials && proposal.materials.length > 0) {
      message += `\n**Preferred Materials:** ${proposal.materials.join(', ')}`;
    }

    if (proposal.dimensions) {
      message += `\n**Dimensions:** ${proposal.dimensions}`;
    }

    if (proposal.colorPreferences && proposal.colorPreferences.length > 0) {
      message += `\n**Color Preferences:** ${proposal.colorPreferences.join(', ')}`;
    }

    if (proposal.specifications && Object.keys(proposal.specifications).length > 0) {
      message += `\n\n**Additional Specifications:**`;
      Object.entries(proposal.specifications).forEach(([key, value]) => {
        message += `\n• **${key}:** ${value}`;
      });
    }

    message += `\n\nWould you be interested in creating this custom piece for me?`;

    return message;
  }

  private formatCustomOrderResponse(response: CustomOrderResponse): string {
    if (response.accepted) {
      let message = `✅ **Custom Order Accepted**

${response.message}`;

      if (response.canProceed) {
        message += `\n\nI'd be happy to create this custom piece for you! I'll prepare a formal quote with all the details.`;
      } else if (response.requiresMoreInfo) {
        message += `\n\nI'm interested, but I need some additional information before proceeding.`;

        if (response.additionalQuestions && response.additionalQuestions.length > 0) {
          message += `\n\n**Questions:**`;
          response.additionalQuestions.forEach((question, index) => {
            message += `\n${index + 1}. ${question}`;
          });
        }
      }

      return message;
    } else {
      let message = `💬 **Custom Order Response**

${response.message}`;

      if (response.counterOffer) {
        message += `\n\n**Counter Offer:**
- **Price:** $${response.counterOffer.price}
- **Timeline:** ${response.counterOffer.duration}
- **Modifications:** ${response.counterOffer.modifications}`;

        if (response.counterOffer.conditions && response.counterOffer.conditions.length > 0) {
          message += `\n• **Conditions:**`;
          response.counterOffer.conditions.forEach((condition) => {
            message += `\n  - ${condition}`;
          });
        }
      }

      if (response.requiresMoreInfo && response.additionalQuestions) {
        message += `\n\n**I need more information about:**`;
        response.additionalQuestions.forEach((question, index) => {
          message += `\n${index + 1}. ${question}`;
        });
      }

      return message;
    }
  }

  private formatProposalUpdate(updates: Partial<CustomOrderProposal>): string {
    let message = `📝 **Custom Order Updated**

I've updated my custom order request with the following changes:

`;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);

        if (Array.isArray(value)) {
          message += `• **${capitalizedKey}:** ${value.join(', ')}\n`;
        } else if (typeof value === 'object') {
          message += `• **${capitalizedKey}:** ${JSON.stringify(value, null, 2)}\n`;
        } else {
          message += `• **${capitalizedKey}:** ${value}\n`;
        }
      }
    });

    message += `\nPlease let me know if these changes work for you!`;

    return message;
  }

  // Cleanup method to prevent memory leaks from cache
  public cleanupCache(): void {
    const today = new Date().toISOString().split('T')[0];

    for (const [key, value] of this.dailyOrderCounts.entries()) {
      if (value.date !== today) {
        this.dailyOrderCounts.delete(key);
      }
    }
  }
}

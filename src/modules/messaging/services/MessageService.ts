import { IMessageService } from './MessageService.interface';
import { ICustomOrderService } from '../../custom-order/services/CustomOrderService.interface';
import {
  Message,
  MessageWithUsers,
  CreateMessageDto,
  MessageQueryOptions,
  Conversation,
  MessageType,
} from '../models/Message';
import {
  CustomOrderChatDto,
  ArtisanResponseDto,
  CounterOfferDto,
  AcceptOfferDto,
  RejectOfferDto,
} from '../../custom-order/models/CustomOrder';
import { IMessageRepository } from '../repositories/MessageRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { INotificationService } from '../../notification/services/NotificationService.interface';
import { ISocketService } from '../../../core/infrastructure/socket/SocketService.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class MessageService implements IMessageService {
  private messageRepository: IMessageRepository;
  private userRepository: IUserRepository;
  private customOrderService: ICustomOrderService;
  private notificationService: INotificationService;
  private _socketService?: ISocketService;
  private logger = Logger.getInstance();

  constructor() {
    this.messageRepository = container.resolve<IMessageRepository>('messageRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.customOrderService = container.resolve<ICustomOrderService>('customOrderService');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  private get socketService(): ISocketService {
    if (!this._socketService) {
      this._socketService = container.resolve<ISocketService>('socketService');
    }
    return this._socketService;
  }

  async sendMessage(senderId: string, data: CreateMessageDto): Promise<MessageWithUsers> {
    try {
      // Validate users exist
      const [sender, receiver] = await Promise.all([
        this.userRepository.findById(senderId),
        this.userRepository.findById(data.receiverId),
      ]);

      if (!sender) {
        throw new AppError('Sender not found', 404, 'SENDER_NOT_FOUND');
      }

      if (!receiver) {
        throw new AppError('Receiver not found', 404, 'RECEIVER_NOT_FOUND');
      }

      // Check messaging permissions
      const canSend = await this.canSendMessageTo(senderId, data.receiverId);
      if (!canSend) {
        throw new AppError('You cannot send messages to this user', 403, 'MESSAGE_FORBIDDEN');
      }

      // Validate content
      if (!data.content || data.content.trim().length === 0) {
        throw new AppError('Message content cannot be empty', 400, 'EMPTY_MESSAGE');
      }

      if (data.content.length > 2000) {
        throw new AppError(
          'Message content cannot exceed 2000 characters',
          400,
          'MESSAGE_TOO_LONG',
        );
      }

      // Validate quote request if provided
      if (data.quoteRequestId) {
        const hasAccess = await this.customOrderService.validateOrderAccess(
          data.quoteRequestId,
          senderId,
        );

        if (!hasAccess) {
          throw new AppError(
            'You do not have access to this quote discussion',
            403,
            'QUOTE_ACCESS_DENIED',
          );
        }
      }

      // Create message
      const message = await this.messageRepository.createMessage(senderId, {
        ...data,
        content: data.content.trim(),
      });

      // Send real-time notification via Socket.io
      await this.socketService.sendMessage(data.receiverId, message);

      // Send push notification
      await this.notificationService.notifyMessage(message.id, senderId, data.receiverId);

      this.logger.info(`Message sent from ${senderId} to ${data.receiverId}`);

      return message;
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send message', 500, 'SERVICE_ERROR');
    }
  }

  // Business logic: Who can message whom
  async canSendMessageTo(senderId: string, receiverId: string): Promise<boolean> {
    try {
      // Can't send to self
      if (senderId === receiverId) {
        return false;
      }

      // Get both users
      const [sender, receiver] = await Promise.all([
        this.userRepository.findById(senderId),
        this.userRepository.findById(receiverId),
      ]);

      if (!sender || !receiver) {
        return false;
      }

      // Business rules:
      // 1. Anyone can message ARTISAN (since artisans can sell)
      if (receiver.role === 'ARTISAN') {
        return true;
      }

      // 2. ARTISAN can message anyone (since artisans are also customers)
      if (sender.role === 'ARTISAN') {
        return true;
      }

      // 3. Pure CUSTOMER cannot message pure CUSTOMER
      if (sender.role === 'CUSTOMER' && receiver.role === 'CUSTOMER') {
        return false;
      }

      // Default allow for other cases
      return true;
    } catch (error) {
      this.logger.error(`Error checking message permission: ${error}`);
      return false;
    }
  }

  /**
   * FIXED: Create custom order via chat (NEW APPROACH)
   * Only creates custom order, returns the order data for message creation
   */
  async createCustomOrderInChat(
    senderId: string,
    receiverId: string,
    customOrderData: CustomOrderChatDto,
  ) {
    try {
      // Validate both users exist
      const [sender, receiver] = await Promise.all([
        this.userRepository.findById(senderId),
        this.userRepository.findById(receiverId),
      ]);

      if (!sender) {
        throw new AppError('Sender not found', 404, 'SENDER_NOT_FOUND');
      }

      if (!receiver) {
        throw new AppError('Receiver not found', 404, 'RECEIVER_NOT_FOUND');
      }

      // Validate: can only send custom order to ARTISAN
      if (receiver.role !== 'ARTISAN') {
        throw new AppError(
          'Custom orders can only be sent to artisans',
          403,
          'INVALID_RECEIVER_ROLE',
        );
      }

      // Create quote request through custom order service
      const quoteRequest = await this.customOrderService.createCustomOrder(senderId, {
        artisanId: receiverId,
        title: customOrderData.title,
        description: customOrderData.description,
        estimatedPrice: customOrderData.estimatedPrice,
        customerBudget: customOrderData.customerBudget,
        timeline: customOrderData.timeline,
        specifications: customOrderData.specifications,
        attachmentUrls: customOrderData.attachments || [],
        referenceProductId: customOrderData.referenceProductId,
        expiresInDays: customOrderData.expiresInDays,
      });

      this.logger.info(
        `Custom order created for chat: ${quoteRequest.id} from ${senderId} to ${receiverId}`,
      );

      return quoteRequest;
    } catch (error) {
      this.logger.error(`Error creating custom order for chat: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create custom order for chat', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * FIXED: Send custom order card message (SEPARATED FROM CREATION)
   * This method only sends the message card, doesn't create custom order
   */
  async sendCustomOrderCardMessage(
    senderId: string,
    receiverId: string,
    customOrderId: string,
    content: string,
    messageType: 'create' | 'response' | 'update' = 'create',
    additionalData?: any,
  ): Promise<MessageWithUsers> {
    try {
      // Get custom order details
      const customOrder = await this.customOrderService.getCustomOrderById(customOrderId);
      if (!customOrder) {
        throw new AppError('Custom order not found', 404, 'CUSTOM_ORDER_NOT_FOUND');
      }

      // Validate access
      const hasAccess = await this.customOrderService.validateOrderAccess(customOrderId, senderId);
      if (!hasAccess) {
        throw new AppError('Access denied to custom order', 403, 'ACCESS_DENIED');
      }

      // Prepare product mentions data
      const productMentions = {
        type: messageType === 'create' ? 'custom_order_creation' : 'custom_order_response',
        negotiationId: customOrderId,
        customerId: customOrder.customer.id,
        artisanId: customOrder.artisan.id,
        status: customOrder.status,
        lastActor: senderId === customOrder.customer.id ? 'customer' : 'artisan',
        timestamp: new Date().toISOString(),
        proposal: {
          title: customOrder.title,
          description: customOrder.description,
          estimatedPrice: customOrder.estimatedPrice,
          timeline: customOrder.timeline,
          specifications: customOrder.specifications,
        },
        finalPrice: customOrder.finalPrice,
        ...additionalData,
      };

      // Create and send message
      const message = await this.sendMessage(senderId, {
        receiverId,
        content,
        type: MessageType.CUSTOM_ORDER,
        quoteRequestId: customOrderId,
        productMentions,
      });

      this.logger.info(
        `Custom order card message sent: ${customOrderId} from ${senderId} to ${receiverId}`,
      );

      return message;
    } catch (error) {
      this.logger.error(`Error sending custom order card message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send custom order card message', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * ARTISAN respond to custom order via chat
   */
  async respondToCustomOrderInChat(
    artisanId: string,
    customerId: string,
    quoteRequestId: string,
    response: ArtisanResponseDto & { message: string },
  ): Promise<MessageWithUsers> {
    try {
      // Validate artisan
      const artisan = await this.userRepository.findById(artisanId);
      if (!artisan || artisan.role !== 'ARTISAN') {
        throw new AppError(
          'Only artisans can respond to custom orders',
          403,
          'INVALID_RESPONDER_ROLE',
        );
      }

      // Update quote request through custom order service
      const updatedQuoteRequest = await this.customOrderService.respondToCustomOrder(
        quoteRequestId,
        artisanId,
        response,
      );

      // Send custom order card message
      const message = await this.sendCustomOrderCardMessage(
        artisanId,
        customerId,
        quoteRequestId,
        response.message,
        'response',
        {
          action: response.action,
          finalPrice: response.finalPrice,
        },
      );

      this.logger.info(`Custom order responded in chat: ${quoteRequestId} - ${response.action}`);

      return message;
    } catch (error) {
      this.logger.error(`Error responding to custom order in chat: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to custom order in chat', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Customer counter offer via chat
   */
  async customerCounterOfferInChat(
    customerId: string,
    artisanId: string,
    quoteRequestId: string,
    counterData: CounterOfferDto & { message: string },
  ): Promise<MessageWithUsers> {
    try {
      // Validate customer
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Counter offer through custom order service
      const updatedOrder = await this.customOrderService.customerCounterOffer(
        quoteRequestId,
        customerId,
        counterData,
      );

      // Send custom order card message
      const message = await this.sendCustomOrderCardMessage(
        customerId,
        artisanId,
        quoteRequestId,
        counterData.message,
        'response',
        {
          action: 'CUSTOMER_COUNTER_OFFER',
          finalPrice: counterData.finalPrice,
        },
      );

      this.logger.info(
        `Customer counter offer in chat: ${quoteRequestId} by customer ${customerId}`,
      );

      return message;
    } catch (error) {
      this.logger.error(`Error customer counter offer in chat: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to make counter offer in chat', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Customer accept offer via chat
   */
  async customerAcceptOfferInChat(
    customerId: string,
    artisanId: string,
    quoteRequestId: string,
    acceptData: AcceptOfferDto & { message: string },
  ): Promise<MessageWithUsers> {
    try {
      // Validate customer
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Accept offer through custom order service
      const acceptedOrder = await this.customOrderService.customerAcceptOffer(
        quoteRequestId,
        customerId,
        acceptData,
      );

      // Send custom order card message
      const message = await this.sendCustomOrderCardMessage(
        customerId,
        artisanId,
        quoteRequestId,
        acceptData.message,
        'response',
        {
          action: 'CUSTOMER_ACCEPT',
          finalPrice: acceptedOrder.finalPrice,
        },
      );

      this.logger.info(
        `Customer accepted offer in chat: ${quoteRequestId} by customer ${customerId}`,
      );

      return message;
    } catch (error) {
      this.logger.error(`Error customer accept offer in chat: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to accept offer in chat', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Customer reject offer via chat
   */
  async customerRejectOfferInChat(
    customerId: string,
    artisanId: string,
    quoteRequestId: string,
    rejectData: RejectOfferDto & { message: string },
  ): Promise<MessageWithUsers> {
    try {
      // Validate customer
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Reject offer through custom order service
      const rejectedOrder = await this.customOrderService.customerRejectOffer(
        quoteRequestId,
        customerId,
        rejectData,
      );

      // Send custom order card message
      const message = await this.sendCustomOrderCardMessage(
        customerId,
        artisanId,
        quoteRequestId,
        rejectData.message,
        'response',
        {
          action: 'CUSTOMER_REJECT',
          reason: rejectData.reason,
        },
      );

      this.logger.info(
        `Customer rejected offer in chat: ${quoteRequestId} by customer ${customerId}`,
      );

      return message;
    } catch (error) {
      this.logger.error(`Error customer reject offer in chat: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject offer in chat', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Continue quote discussion
   */
  async sendQuoteDiscussionMessage(
    senderId: string,
    receiverId: string,
    quoteId: string,
    content: string,
  ): Promise<MessageWithUsers> {
    try {
      // Validate quote access through custom order service
      const hasAccess = await this.customOrderService.validateOrderAccess(quoteId, senderId);
      if (!hasAccess) {
        throw new AppError(
          'You do not have access to this quote discussion',
          403,
          'QUOTE_ACCESS_DENIED',
        );
      }

      return await this.sendMessage(senderId, {
        receiverId,
        content,
        type: MessageType.CUSTOM_ORDER,
        quoteRequestId: quoteId,
      });
    } catch (error) {
      this.logger.error(`Error sending quote discussion message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send quote discussion message', 500, 'SERVICE_ERROR');
    }
  }

  async sendMediaMessage(
    senderId: string,
    receiverId: string,
    mediaUrl: string,
    mediaType: 'image' | 'file',
    content?: string,
  ): Promise<MessageWithUsers> {
    try {
      const type = mediaType === 'image' ? MessageType.IMAGE : MessageType.FILE;

      return await this.sendMessage(senderId, {
        receiverId,
        content: content || `Shared ${mediaType}`,
        type,
        attachments: [mediaUrl],
      });
    } catch (error) {
      this.logger.error(`Error sending media message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send media message', 500, 'SERVICE_ERROR');
    }
  }

  // ... Rest of existing methods remain the same
  async getMessages(
    userId: string,
    options?: MessageQueryOptions,
  ): Promise<PaginatedResult<MessageWithUsers>> {
    try {
      return await this.messageRepository.getMessages(options || {}, userId);
    } catch (error) {
      this.logger.error(`Error getting messages: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get messages', 500, 'SERVICE_ERROR');
    }
  }

  async getConversationMessages(
    userId: string,
    otherUserId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MessageWithUsers>> {
    try {
      const otherUser = await this.userRepository.findById(otherUserId);
      if (!otherUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check if they can message each other
      const canMessage = await this.canSendMessageTo(userId, otherUserId);
      if (!canMessage) {
        throw new AppError('You cannot view messages with this user', 403, 'MESSAGE_FORBIDDEN');
      }

      return await this.messageRepository.getConversationMessages(userId, otherUserId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting conversation messages: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get conversation messages', 500, 'SERVICE_ERROR');
    }
  }

  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.messageRepository.markAsRead(messageId, userId);

      if (result) {
        const message = await this.messageRepository.findById(messageId);
        if (message && message.senderId !== userId) {
          await this.socketService.broadcastToUser(message.senderId, 'message-read', {
            messageId,
            readBy: userId,
            readAt: new Date(),
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark message as read', 500, 'SERVICE_ERROR');
    }
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<number> {
    try {
      const count = await this.messageRepository.markConversationAsRead(userId, otherUserId);

      if (count > 0) {
        await this.socketService.broadcastToUser(otherUserId, 'conversation-read', {
          userId,
          readCount: count,
          readAt: new Date(),
        });
      }

      return count;
    } catch (error) {
      this.logger.error(`Error marking conversation as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark conversation as read', 500, 'SERVICE_ERROR');
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      return await this.messageRepository.getConversations(userId);
    } catch (error) {
      this.logger.error(`Error getting conversations: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get conversations', 500, 'SERVICE_ERROR');
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      return await this.messageRepository.getUnreadMessageCount(userId);
    } catch (error) {
      this.logger.error(`Error getting unread message count: ${error}`);
      return 0;
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.messageRepository.deleteMessage(messageId, userId);

      if (result) {
        this.logger.info(`Message ${messageId} deleted by user ${userId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete message', 500, 'SERVICE_ERROR');
    }
  }

  async validateMessageAccess(messageId: string, userId: string): Promise<boolean> {
    try {
      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        return false;
      }

      return message.senderId === userId || message.receiverId === userId;
    } catch (error) {
      this.logger.error(`Error validating message access: ${error}`);
      return false;
    }
  }
}

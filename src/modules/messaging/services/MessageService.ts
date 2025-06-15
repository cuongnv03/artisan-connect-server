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

      // BUSINESS RULE: Check messaging permissions
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

  // BUSINESS LOGIC: Who can message whom
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

      // 🆕 BUSINESS RULES CẬP NHẬT:
      // 1. Ai cũng có thể nhắn cho ARTISAN (vì artisan có thể bán hàng)
      if (receiver.role === 'ARTISAN') {
        return true;
      }

      // 2. ARTISAN có thể nhắn cho ai (vì artisan cũng là customer)
      if (sender.role === 'ARTISAN') {
        return true;
      }

      // 3. CUSTOMER thuần túy không thể nhắn cho CUSTOMER thuần túy
      if (sender.role === 'CUSTOMER' && receiver.role === 'CUSTOMER') {
        return false;
      }

      // Mặc định cho phép các trường hợp khác
      return true;
    } catch (error) {
      this.logger.error(`Error checking message permission: ${error}`);
      return false;
    }
  }

  /**
   * TẠO CUSTOM ORDER THÔNG QUA CHAT
   */
  async sendCustomOrderMessage(
    senderId: string,
    receiverId: string,
    customOrderData: any,
    content: string,
  ): Promise<MessageWithUsers> {
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

      // VALIDATE: Chỉ có thể gửi custom order đến ARTISAN
      if (receiver.role !== 'ARTISAN') {
        throw new AppError(
          'Custom orders can only be sent to artisans',
          403,
          'INVALID_RECEIVER_ROLE',
        );
      }

      // TẠO QUOTE REQUEST THÔNG QUA CUSTOM ORDER SERVICE
      const quoteRequest = await this.customOrderService.createCustomOrder(senderId, {
        artisanId: receiverId,
        title: customOrderData.title || 'Custom Order Request',
        description: customOrderData.description || content,
        estimatedPrice: customOrderData.estimatedPrice,
        customerBudget: customOrderData.customerBudget,
        timeline: customOrderData.timeline,
        specifications: customOrderData.specifications,
        attachmentUrls: customOrderData.attachments || [],
        referenceProductId: customOrderData.referenceProductId,
      });

      // TẠO MESSAGE VỚI QUOTE REQUEST ID
      const message = await this.sendMessage(senderId, {
        receiverId,
        content,
        type: MessageType.CUSTOM_ORDER,
        quoteRequestId: quoteRequest.id,
        productMentions: {
          type: 'custom_order_creation',
          quoteRequestId: quoteRequest.id,
          customOrderData,
        },
      });

      this.logger.info(
        `Custom order created in chat: ${quoteRequest.id} from ${senderId} (${sender.role}) to ${receiverId} (ARTISAN)`,
      );

      return message;
    } catch (error) {
      this.logger.error(`Error sending custom order message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send custom order message', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * TRẢ LỜI CUSTOM ORDER (NGHỆ NHÂN)
   */
  async respondToCustomOrderInChat(
    artisanId: string,
    customerId: string,
    quoteRequestId: string,
    response: {
      action: 'ACCEPT' | 'REJECT' | 'COUNTER_OFFER';
      finalPrice?: number;
      message: string;
      response?: any;
    },
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

      // CẬP NHẬT QUOTE REQUEST THÔNG QUA CUSTOM ORDER SERVICE
      const updatedQuoteRequest = await this.customOrderService.respondToCustomOrder(
        quoteRequestId,
        artisanId,
        response,
      );

      // TẠO MESSAGE PHẢN HỒI
      const message = await this.sendMessage(artisanId, {
        receiverId: customerId,
        content: response.message,
        type: MessageType.QUOTE_DISCUSSION,
        quoteRequestId: quoteRequestId,
        productMentions: {
          type: 'custom_order_response',
          action: response.action,
          finalPrice: response.finalPrice,
          quoteRequestId: quoteRequestId,
        },
      });

      this.logger.info(`Custom order responded in chat: ${quoteRequestId} - ${response.action}`);

      return message;
    } catch (error) {
      this.logger.error(`Error responding to custom order in chat: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to custom order in chat', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * TIẾP TỤC THẢO LUẬN VỀ QUOTE REQUEST
   */
  async sendQuoteDiscussionMessage(
    senderId: string,
    receiverId: string,
    quoteId: string,
    content: string,
  ): Promise<MessageWithUsers> {
    try {
      // Validate quote access thông qua custom order service
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
        type: MessageType.QUOTE_DISCUSSION,
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

  // ... rest of the methods remain the same
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

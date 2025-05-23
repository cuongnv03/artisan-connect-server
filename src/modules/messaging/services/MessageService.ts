import { IMessageService } from './MessageService.interface';
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
  private notificationService: INotificationService;
  private _socketService?: ISocketService;
  private logger = Logger.getInstance();

  constructor() {
    this.messageRepository = container.resolve<IMessageRepository>('messageRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  // Lazy getter for socketService
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

      // Check if sender can message receiver
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
      // Validate other user exists
      const otherUser = await this.userRepository.findById(otherUserId);
      if (!otherUser) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
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
        // Get message to notify sender about read status
        const message = await this.messageRepository.findById(messageId);
        if (message && message.senderId !== userId) {
          // Notify sender that message was read via Socket.io
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
        // Notify other user that conversation was read
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

  async sendQuoteDiscussionMessage(
    senderId: string,
    receiverId: string,
    quoteId: string,
    content: string,
  ): Promise<MessageWithUsers> {
    try {
      return await this.sendMessage(senderId, {
        receiverId,
        content,
        type: MessageType.QUOTE_DISCUSSION,
        metadata: {
          quoteId,
          messageType: 'quote_discussion',
        },
      });
    } catch (error) {
      this.logger.error(`Error sending quote discussion message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send quote discussion message', 500, 'SERVICE_ERROR');
    }
  }

  async sendCustomOrderMessage(
    senderId: string,
    receiverId: string,
    orderData: any,
    content: string,
  ): Promise<MessageWithUsers> {
    try {
      return await this.sendMessage(senderId, {
        receiverId,
        content,
        type: MessageType.CUSTOM_ORDER,
        metadata: {
          orderData,
          messageType: 'custom_order',
        },
      });
    } catch (error) {
      this.logger.error(`Error sending custom order message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send custom order message', 500, 'SERVICE_ERROR');
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
      return await this.sendMessage(senderId, {
        receiverId,
        content: content || `Shared ${mediaType}`,
        type: MessageType.IMAGE,
        metadata: {
          mediaUrl,
          mediaType,
        },
      });
    } catch (error) {
      this.logger.error(`Error sending media message: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send media message', 500, 'SERVICE_ERROR');
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

  async canSendMessageTo(senderId: string, receiverId: string): Promise<boolean> {
    try {
      // Can't send to self
      if (senderId === receiverId) {
        return false;
      }

      // For now, allow messaging between any users
      // In the future, you could add restrictions like:
      // - Only allow messaging between customers and artisans
      // - Only allow messaging if they've had a transaction
      // - Check if users are blocked

      return true;
    } catch (error) {
      this.logger.error(`Error checking message permission: ${error}`);
      return false;
    }
  }
}

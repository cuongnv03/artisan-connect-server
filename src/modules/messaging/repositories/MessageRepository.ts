import { PrismaClient } from '@prisma/client';
import { IMessageRepository } from './MessageRepository.interface';
import {
  Message,
  MessageWithUsers,
  CreateMessageDto,
  MessageQueryOptions,
  Conversation,
} from '../models/Message';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { PaginationUtils } from '../../../shared/utils/PaginationUtils';
import { AppError } from '../../../core/errors/AppError';

export class MessageRepository implements IMessageRepository {
  constructor(private prisma: PrismaClient) {}

  async createMessage(senderId: string, data: CreateMessageDto): Promise<MessageWithUsers> {
    try {
      return await this.prisma.message.create({
        data: {
          senderId,
          receiverId: data.receiverId,
          content: data.content,
          type: data.type || 'TEXT',
          metadata: data.metadata,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      throw new AppError('Failed to create message', 500, 'MESSAGE_CREATE_FAILED');
    }
  }

  async findById(id: string): Promise<MessageWithUsers | null> {
    try {
      return await this.prisma.message.findUnique({
        where: { id },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      throw new AppError('Failed to find message', 500, 'MESSAGE_FIND_FAILED');
    }
  }

  async getMessages(
    options: MessageQueryOptions,
    userId: string,
  ): Promise<PaginatedResult<MessageWithUsers>> {
    try {
      const { page = 1, limit = 20, conversationWith, type, isRead, dateFrom, dateTo } = options;
      const skip = PaginationUtils.calculateSkip(page, limit);

      const where: any = {
        OR: [{ senderId: userId }, { receiverId: userId }],
      };

      if (conversationWith) {
        where.OR = [
          { senderId: userId, receiverId: conversationWith },
          { senderId: conversationWith, receiverId: userId },
        ];
      }

      if (type) {
        where.type = type;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
        where.receiverId = userId; // Only check read status for received messages
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            receiver: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.message.count({ where }),
      ]);

      return PaginationUtils.createPaginatedResult(messages, total, page, limit);
    } catch (error) {
      throw new AppError('Failed to get messages', 500, 'MESSAGE_GET_FAILED');
    }
  }

  async getConversationMessages(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<MessageWithUsers>> {
    try {
      const skip = PaginationUtils.calculateSkip(page, limit);

      const where = {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      };

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            receiver: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.message.count({ where }),
      ]);

      return PaginationUtils.createPaginatedResult(messages, total, page, limit);
    } catch (error) {
      throw new AppError('Failed to get conversation messages', 500, 'CONVERSATION_GET_FAILED');
    }
  }

  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.message.updateMany({
        where: {
          id: messageId,
          receiverId: userId,
        },
        data: {
          isRead: true,
        },
      });

      return result.count > 0;
    } catch (error) {
      throw new AppError('Failed to mark message as read', 500, 'MESSAGE_READ_FAILED');
    }
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<number> {
    try {
      const result = await this.prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return result.count;
    } catch (error) {
      throw new AppError('Failed to mark conversation as read', 500, 'CONVERSATION_READ_FAILED');
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get all unique conversation partners
      const conversations = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT
          CASE 
            WHEN m.sender_id = ${userId} THEN m.receiver_id
            ELSE m.sender_id
          END as participant_id,
          MAX(m.created_at) as last_activity
        FROM "Message" m
        WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
        GROUP BY participant_id
        ORDER BY last_activity DESC
      `;

      // Get detailed information for each conversation
      const result: Conversation[] = [];

      for (const conv of conversations) {
        const participantId = conv.participant_id;

        // Get participant details
        const participant = await this.prisma.user.findUnique({
          where: { id: participantId },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        });

        if (!participant) continue;

        // Get last message
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: participantId },
              { senderId: participantId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        // Get unread count
        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: participantId,
            receiverId: userId,
            isRead: false,
          },
        });

        result.push({
          participantId,
          participant,
          lastMessage: lastMessage || undefined,
          unreadCount,
          lastActivity: conv.last_activity,
        });
      }

      return result;
    } catch (error) {
      throw new AppError('Failed to get conversations', 500, 'CONVERSATION_LIST_FAILED');
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      return await this.prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });
    } catch (error) {
      throw new AppError('Failed to get unread message count', 500, 'MESSAGE_COUNT_FAILED');
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.message.deleteMany({
        where: {
          id: messageId,
          senderId: userId, // Only sender can delete
        },
      });

      return result.count > 0;
    } catch (error) {
      throw new AppError('Failed to delete message', 500, 'MESSAGE_DELETE_FAILED');
    }
  }
}

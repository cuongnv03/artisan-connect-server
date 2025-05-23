import {
  Message,
  MessageWithUsers,
  CreateMessageDto,
  MessageQueryOptions,
  Conversation,
} from '../models/Message';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IMessageRepository {
  createMessage(senderId: string, data: CreateMessageDto): Promise<MessageWithUsers>;
  findById(id: string): Promise<MessageWithUsers | null>;
  getMessages(
    options: MessageQueryOptions,
    userId: string,
  ): Promise<PaginatedResult<MessageWithUsers>>;
  getConversationMessages(
    userId: string,
    otherUserId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MessageWithUsers>>;
  markAsRead(messageId: string, userId: string): Promise<boolean>;
  markConversationAsRead(userId: string, otherUserId: string): Promise<number>;
  getConversations(userId: string): Promise<Conversation[]>;
  getUnreadMessageCount(userId: string): Promise<number>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
}

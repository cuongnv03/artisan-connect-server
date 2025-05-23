import {
  Message,
  MessageWithUsers,
  CreateMessageDto,
  MessageQueryOptions,
  Conversation,
} from '../models/Message';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IMessageService {
  // Core messaging
  sendMessage(senderId: string, data: CreateMessageDto): Promise<MessageWithUsers>;
  getMessages(
    userId: string,
    options?: MessageQueryOptions,
  ): Promise<PaginatedResult<MessageWithUsers>>;
  getConversationMessages(
    userId: string,
    otherUserId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<MessageWithUsers>>;

  // Read status
  markAsRead(messageId: string, userId: string): Promise<boolean>;
  markConversationAsRead(userId: string, otherUserId: string): Promise<number>;

  // Conversations
  getConversations(userId: string): Promise<Conversation[]>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Delete
  deleteMessage(messageId: string, userId: string): Promise<boolean>;

  // Special message types
  sendQuoteDiscussionMessage(
    senderId: string,
    receiverId: string,
    quoteId: string,
    content: string,
  ): Promise<MessageWithUsers>;

  sendCustomOrderMessage(
    senderId: string,
    receiverId: string,
    orderData: any,
    content: string,
  ): Promise<MessageWithUsers>;

  // File sharing
  sendMediaMessage(
    senderId: string,
    receiverId: string,
    mediaUrl: string,
    mediaType: 'image' | 'file',
    content?: string,
  ): Promise<MessageWithUsers>;

  // Validation
  validateMessageAccess(messageId: string, userId: string): Promise<boolean>;
  canSendMessageTo(senderId: string, receiverId: string): Promise<boolean>;
}

import {
  Message,
  MessageWithUsers,
  CreateMessageDto,
  MessageQueryOptions,
  Conversation,
} from '../models/Message';
import {
  CustomOrderChatDto,
  ArtisanResponseDto,
  CounterOfferDto,
  AcceptOfferDto,
  RejectOfferDto,
} from '../../custom-order/models/CustomOrder';
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

  // Custom order chat integration (ENHANCED)
  sendCustomOrderMessage(
    senderId: string,
    receiverId: string,
    customOrderData: CustomOrderChatDto,
    content: string,
  ): Promise<MessageWithUsers>;

  respondToCustomOrderInChat(
    artisanId: string,
    customerId: string,
    quoteRequestId: string,
    response: ArtisanResponseDto & { message: string },
  ): Promise<MessageWithUsers>;

  // NEW: Customer bidirectional operations
  customerCounterOfferInChat(
    customerId: string,
    artisanId: string,
    quoteRequestId: string,
    counterData: CounterOfferDto & { message: string },
  ): Promise<MessageWithUsers>;

  customerAcceptOfferInChat(
    customerId: string,
    artisanId: string,
    quoteRequestId: string,
    acceptData: AcceptOfferDto & { message: string },
  ): Promise<MessageWithUsers>;

  customerRejectOfferInChat(
    customerId: string,
    artisanId: string,
    quoteRequestId: string,
    rejectData: RejectOfferDto & { message: string },
  ): Promise<MessageWithUsers>;

  sendQuoteDiscussionMessage(
    senderId: string,
    receiverId: string,
    quoteId: string,
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

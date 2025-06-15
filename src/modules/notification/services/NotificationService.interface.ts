import {
  Notification,
  NotificationWithSender,
  CreateNotificationDto,
  NotificationQueryOptions,
} from '../models/Notification';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface INotificationService {
  // Core operations
  createNotification(data: CreateNotificationDto): Promise<Notification>;
  sendNotification(data: CreateNotificationDto): Promise<void>;

  // Read operations
  getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<NotificationWithSender>>;
  getNotificationById(id: string, userId: string): Promise<NotificationWithSender | null>;
  getUnreadCount(userId: string): Promise<number>;

  // Update operations
  markAsRead(id: string, userId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;

  // Delete operations
  deleteNotification(id: string, userId: string): Promise<boolean>;

  // Utility methods
  createAndSendNotification(data: CreateNotificationDto): Promise<void>;

  // Bulk operations
  sendBulkNotifications(notifications: CreateNotificationDto[]): Promise<void>;

  // Helper methods for specific notification types
  notifyLike(postId: string, likerId: string, postOwnerId: string): Promise<void>;
  notifyComment(postId: string, commenterId: string, postOwnerId: string): Promise<void>;
  notifyFollow(followerId: string, followingId: string): Promise<void>;
  notifyMessage(messageId: string, senderId: string, receiverId: string): Promise<void>;

  // ORDER NOTIFICATIONS
  notifyOrderCreated(customerId: string, orderId: string): Promise<void>;
  notifyNewOrderForSeller(sellerId: string, orderId: string): Promise<void>;
  notifyOrderStatusChanged(customerId: string, orderId: string, status: string): Promise<void>;
  notifyOrderCancelled(customerId: string, orderId: string): Promise<void>;
  notifyOrderCancelledForSeller(sellerId: string, orderId: string): Promise<void>;

  // PAYMENT NOTIFICATIONS
  notifyPaymentSuccess(customerId: string, orderId: string): Promise<void>;
  notifyPaymentFailed(customerId: string, orderId: string, reason?: string): Promise<void>;
  notifyPaymentRefunded(customerId: string, orderId: string): Promise<void>;

  // QUOTE NOTIFICATIONS
  notifyQuote(
    quoteId: string,
    customerId: string,
    artisanId: string,
    action: string,
  ): Promise<void>;

  // DISPUTE NOTIFICATIONS
  notifyDisputeCreated(complainantId: string, disputeId: string): Promise<void>;
  notifyDisputeUpdated(recipientId: string, disputeId: string): Promise<void>;

  // RETURN NOTIFICATIONS
  notifyReturnCreated(sellerId: string, returnId: string): Promise<void>;
  notifyReturnUpdated(requesterId: string, returnId: string): Promise<void>;

  // PRICE NEGOTIATION NOTIFICATIONS
  notifyPriceNegotiationRequest(
    productId: string,
    customerId: string,
    artisanId: string,
    proposedPrice: number,
  ): Promise<void>;
  notifyPriceNegotiationResponse(
    productId: string,
    customerId: string,
    artisanId: string,
    action: string,
    price?: number,
  ): Promise<void>;
}

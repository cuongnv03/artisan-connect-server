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
  notifyOrder(orderId: string, customerId: string, sellerId: string, status: string): Promise<void>;
  notifyQuote(
    quoteId: string,
    customerId: string,
    artisanId: string,
    action: string,
  ): Promise<void>;
  notifyMessage(messageId: string, senderId: string, receiverId: string): Promise<void>;
}

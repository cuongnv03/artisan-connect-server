import { INotificationService } from './NotificationService.interface';
import {
  Notification,
  NotificationWithSender,
  CreateNotificationDto,
  NotificationQueryOptions,
  NotificationType,
} from '../models/Notification';
import { INotificationRepository } from '../repositories/NotificationRepository.interface';
import { ISocketService } from '../../../core/infrastructure/socket/SocketService.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;
  private _socketService?: ISocketService;
  private logger = Logger.getInstance();

  constructor() {
    this.notificationRepository =
      container.resolve<INotificationRepository>('notificationRepository');
  }

  // Lazy getter for socketService
  private get socketService(): ISocketService {
    if (!this._socketService) {
      this._socketService = container.resolve<ISocketService>('socketService');
    }
    return this._socketService;
  }

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      return await this.notificationRepository.createNotification(data);
    } catch (error) {
      this.logger.error(`Error creating notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create notification', 500, 'SERVICE_ERROR');
    }
  }

  async sendNotification(data: CreateNotificationDto): Promise<void> {
    try {
      const notification = await this.createNotification(data);

      // Send real-time notification via Socket.io
      await this.socketService.sendNotification(data.recipientId, notification);

      this.logger.info(`Notification sent to user ${data.recipientId}: ${data.type}`);
    } catch (error) {
      this.logger.error(`Error sending notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send notification', 500, 'SERVICE_ERROR');
    }
  }

  async getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<NotificationWithSender>> {
    try {
      return await this.notificationRepository.getUserNotifications(userId, options);
    } catch (error) {
      this.logger.error(`Error getting user notifications: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get notifications', 500, 'SERVICE_ERROR');
    }
  }

  async getNotificationById(id: string, userId: string): Promise<NotificationWithSender | null> {
    try {
      const notification = await this.notificationRepository.findById(id);

      if (!notification || notification.recipientId !== userId) {
        return null;
      }

      return notification;
    } catch (error) {
      this.logger.error(`Error getting notification by ID: ${error}`);
      return null;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationRepository.getUnreadCount(userId);
    } catch (error) {
      this.logger.error(`Error getting unread count: ${error}`);
      return 0;
    }
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationRepository.markAsRead(id, userId);

      if (result) {
        // Update unread count in real-time
        const unreadCount = await this.getUnreadCount(userId);
        await this.socketService.updateUnreadCount(userId, unreadCount);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark notification as read', 500, 'SERVICE_ERROR');
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const count = await this.notificationRepository.markAllAsRead(userId);

      if (count > 0) {
        // Update unread count in real-time
        await this.socketService.updateUnreadCount(userId, 0);
      }

      return count;
    } catch (error) {
      this.logger.error(`Error marking all notifications as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark all notifications as read', 500, 'SERVICE_ERROR');
    }
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      return await this.notificationRepository.deleteNotification(id, userId);
    } catch (error) {
      this.logger.error(`Error deleting notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete notification', 500, 'SERVICE_ERROR');
    }
  }

  async createAndSendNotification(data: CreateNotificationDto): Promise<void> {
    try {
      await this.sendNotification(data);
    } catch (error) {
      this.logger.error(`Error creating and sending notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create and send notification', 500, 'SERVICE_ERROR');
    }
  }

  async sendBulkNotifications(notifications: CreateNotificationDto[]): Promise<void> {
    try {
      const promises = notifications.map((notification) => this.sendNotification(notification));
      await Promise.allSettled(promises);

      this.logger.info(`Sent ${notifications.length} bulk notifications`);
    } catch (error) {
      this.logger.error(`Error sending bulk notifications: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send bulk notifications', 500, 'SERVICE_ERROR');
    }
  }

  // Helper methods for specific notification types
  async notifyLike(postId: string, likerId: string, postOwnerId: string): Promise<void> {
    if (likerId === postOwnerId) return; // Don't notify self

    await this.sendNotification({
      recipientId: postOwnerId,
      senderId: likerId,
      type: NotificationType.LIKE,
      title: 'New Like',
      message: 'Someone liked your post',
      data: { postId, likerId },
    });
  }

  async notifyComment(postId: string, commenterId: string, postOwnerId: string): Promise<void> {
    if (commenterId === postOwnerId) return; // Don't notify self

    await this.sendNotification({
      recipientId: postOwnerId,
      senderId: commenterId,
      type: NotificationType.COMMENT,
      title: 'New Comment',
      message: 'Someone commented on your post',
      data: { postId, commenterId },
    });
  }

  async notifyFollow(followerId: string, followingId: string): Promise<void> {
    await this.sendNotification({
      recipientId: followingId,
      senderId: followerId,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      message: 'Someone started following you',
      data: { followerId },
    });
  }

  async notifyOrder(
    orderId: string,
    customerId: string,
    sellerId: string,
    status: string,
  ): Promise<void> {
    const notifications: CreateNotificationDto[] = [];

    // Notify customer about order status change
    notifications.push({
      recipientId: customerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Update',
      message: `Your order status has been updated to ${status}`,
      data: { orderId, status },
    });

    // Notify seller about new order (if status is new)
    if (status === 'PENDING') {
      notifications.push({
        recipientId: sellerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'New Order',
        message: 'You have received a new order',
        data: { orderId, customerId },
      });
    }

    await this.sendBulkNotifications(notifications);
  }

  async notifyQuote(
    quoteId: string,
    customerId: string,
    artisanId: string,
    action: string,
  ): Promise<void> {
    let recipientId: string;
    let title: string;
    let message: string;

    switch (action) {
      case 'REQUEST':
        recipientId = artisanId;
        title = 'New Quote Request';
        message = 'You have received a new quote request';
        break;
      case 'ACCEPT':
      case 'REJECT':
      case 'COUNTER':
        recipientId = customerId;
        title = 'Quote Response';
        message = `Your quote request has been ${action.toLowerCase()}ed`;
        break;
      default:
        return;
    }

    await this.sendNotification({
      recipientId,
      type: NotificationType.QUOTE_RESPONSE,
      title,
      message,
      data: { quoteId, action },
    });
  }

  async notifyMessage(messageId: string, senderId: string, receiverId: string): Promise<void> {
    await this.sendNotification({
      recipientId: receiverId,
      senderId: senderId,
      type: NotificationType.MESSAGE,
      title: 'New Message',
      message: 'You have received a new message',
      data: { messageId },
    });
  }
}

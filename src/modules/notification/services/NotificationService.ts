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
      actionUrl: `/posts/${postId}`,
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
      actionUrl: `/posts/${postId}`,
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
      actionUrl: `/users/${followerId}`,
    });
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
      actionUrl: `/quotes/${quoteId}`,
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
      actionUrl: `/messages/${senderId}`,
    });
  }

  // ORDER NOTIFICATIONS
  async notifyOrderCreated(customerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: customerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Confirmed',
      message: 'Your order has been successfully created',
      data: { orderId },
      actionUrl: `/orders/${orderId}`,
    });
  }

  async notifyNewOrderForSeller(sellerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'New Order Received',
      message: 'You have received a new order',
      data: { orderId },
      actionUrl: `/orders/${orderId}`,
    });
  }

  async notifyOrderStatusChanged(
    customerId: string,
    orderId: string,
    status: string,
  ): Promise<void> {
    await this.sendNotification({
      recipientId: customerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Status Update',
      message: `Your order status has been updated to ${status}`,
      data: { orderId, status },
      actionUrl: `/orders/${orderId}`,
    });
  }

  async notifyOrderCancelled(customerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: customerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Cancelled',
      message: 'Your order has been cancelled',
      data: { orderId },
      actionUrl: `/orders/${orderId}`,
    });
  }

  async notifyOrderCancelledForSeller(sellerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Cancelled',
      message: 'An order has been cancelled',
      data: { orderId },
      actionUrl: `/orders/${orderId}`,
    });
  }

  // PAYMENT NOTIFICATIONS
  async notifyPaymentSuccess(customerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: customerId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: 'Your payment has been processed successfully',
      data: { orderId },
      actionUrl: `/orders/${orderId}`,
    });
  }

  async notifyPaymentFailed(customerId: string, orderId: string, reason?: string): Promise<void> {
    await this.sendNotification({
      recipientId: customerId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: reason || 'Your payment could not be processed',
      data: { orderId, reason },
      actionUrl: `/orders/${orderId}`,
    });
  }

  async notifyPaymentRefunded(customerId: string, orderId: string): Promise<void> {
    await this.sendNotification({
      recipientId: customerId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Refunded',
      message: 'Your payment has been refunded successfully',
      data: { orderId },
      actionUrl: `/orders/${orderId}`,
    });
  }

  // DISPUTE NOTIFICATIONS
  async notifyDisputeCreated(complainantId: string, disputeId: string): Promise<void> {
    await this.sendNotification({
      recipientId: complainantId,
      type: NotificationType.DISPUTE,
      title: 'Dispute Created',
      message: 'Your dispute has been submitted and is under review',
      data: { disputeId },
      actionUrl: `/disputes/${disputeId}`,
    });
  }

  async notifyDisputeUpdated(recipientId: string, disputeId: string): Promise<void> {
    await this.sendNotification({
      recipientId,
      type: NotificationType.DISPUTE,
      title: 'Dispute Update',
      message: 'There is an update on your dispute',
      data: { disputeId },
      actionUrl: `/disputes/${disputeId}`,
    });
  }

  // RETURN NOTIFICATIONS
  async notifyReturnCreated(sellerId: string, returnId: string): Promise<void> {
    await this.sendNotification({
      recipientId: sellerId,
      type: NotificationType.RETURN,
      title: 'Return Request',
      message: 'A customer has requested a return for your order',
      data: { returnId },
      actionUrl: `/returns/${returnId}`,
    });
  }

  async notifyReturnUpdated(requesterId: string, returnId: string): Promise<void> {
    await this.sendNotification({
      recipientId: requesterId,
      type: NotificationType.RETURN,
      title: 'Return Update',
      message: 'There is an update on your return request',
      data: { returnId },
      actionUrl: `/returns/${returnId}`,
    });
  }

  // PRICE NEGOTIATION NOTIFICATIONS
  async notifyPriceNegotiationRequest(
    productId: string,
    customerId: string,
    artisanId: string,
    proposedPrice: number,
  ): Promise<void> {
    await this.sendNotification({
      recipientId: artisanId,
      senderId: customerId,
      type: NotificationType.PRICE_NEGOTIATION,
      title: 'New Price Negotiation',
      message: `A customer wants to negotiate the price to $${proposedPrice} for your product`,
      data: { productId, customerId, proposedPrice, action: 'REQUEST' },
      actionUrl: `/products/${productId}`, // Link đến product page
    });
  }

  async notifyPriceNegotiationResponse(
    productId: string,
    customerId: string,
    artisanId: string,
    action: string,
    price?: number,
  ): Promise<void> {
    let title = '';
    let message = '';

    switch (action) {
      case 'ACCEPT':
        title = 'Price Negotiation Accepted';
        message = `Your price negotiation has been accepted!`;
        break;
      case 'REJECT':
        title = 'Price Negotiation Rejected';
        message = `Your price negotiation has been rejected`;
        break;
      case 'COUNTER':
        title = 'Counter Offer Received';
        message = `The artisan has made a counter offer${price ? ` of $${price}` : ''}`;
        break;
      default:
        title = 'Price Negotiation Update';
        message = 'There is an update on your price negotiation';
    }

    await this.sendNotification({
      recipientId: customerId,
      senderId: artisanId,
      type: NotificationType.PRICE_NEGOTIATION,
      title,
      message,
      data: { productId, artisanId, action, price },
      actionUrl: `/products/${productId}`, // Link đến product page
    });
  }
}

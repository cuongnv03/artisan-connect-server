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
  private logger = Logger.getInstance();

  constructor() {
    this.notificationRepository =
      container.resolve<INotificationRepository>('notificationRepository');
  }

  // Safe getter cho socketService với fallback
  private get socketService(): ISocketService | null {
    try {
      return container.resolve<ISocketService>('socketService');
    } catch (error) {
      this.logger.warn('SocketService not available yet, notifications will be stored only');
      return null;
    }
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
    // Validate notification data
    if (!data.recipientId || !data.type || !data.title || !data.message) {
      this.logger.error(`sendNotification: Invalid notification data - ${JSON.stringify(data)}`);
      throw new Error('Invalid notification data provided');
    }

    try {
      // Create notification in database first
      const notification = await this.createNotification(data);

      this.logger.debug(`Notification created in database: ${notification.id}`);

      // Send real-time notification if socketService is available
      const socketService = this.socketService;
      if (socketService) {
        try {
          await socketService.sendNotification(data.recipientId, notification);
          this.logger.info(`Real-time notification sent to user ${data.recipientId}: ${data.type}`);
        } catch (socketError) {
          this.logger.error(`Failed to send real-time notification: ${socketError}`);
          // Don't throw - notification is already saved in DB
        }
      } else {
        this.logger.info(
          `Notification stored for user ${data.recipientId}: ${data.type} (real-time unavailable)`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send notification', 500, 'NOTIFICATION_SEND_FAILED');
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
    if (!id || !userId) {
      this.logger.error(`markAsRead: Missing required parameters - id: ${id}, userId: ${userId}`);
      return false;
    }

    try {
      const result = await this.notificationRepository.markAsRead(id, userId);

      if (result) {
        // Update unread count in real-time
        try {
          const unreadCount = await this.getUnreadCount(userId);
          const socketService = this.socketService;
          if (socketService) {
            await socketService.updateUnreadCount(userId, unreadCount);
          }
        } catch (socketError) {
          this.logger.error(`Failed to update unread count via socket: ${socketError}`);
          // Don't fail the mark as read operation
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark notification as read', 500, 'MARK_READ_FAILED');
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

  async notifyCustomOrderRequest(
    customerId: string,
    artisanId: string,
    customOrderId: string,
  ): Promise<void> {
    await this.sendNotification({
      recipientId: artisanId,
      senderId: customerId,
      type: NotificationType.CUSTOM_ORDER,
      title: 'New Custom Order Request',
      message: 'You have received a new custom order request',
      data: { customOrderId, action: 'REQUEST' },
      actionUrl: `/customs/${customOrderId}`,
    });
  }

  async notifyCustomOrderResponse(
    customOrderId: string,
    customerId: string,
    artisanId: string,
    action: 'ACCEPT' | 'REJECT' | 'COUNTER_OFFER',
    finalPrice?: number,
  ): Promise<void> {
    let title = '';
    let message = '';

    switch (action) {
      case 'ACCEPT':
        title = 'Custom Order Accepted';
        message = 'Your custom order request has been accepted!';
        break;
      case 'REJECT':
        title = 'Custom Order Rejected';
        message = 'Your custom order request has been rejected';
        break;
      case 'COUNTER_OFFER':
        title = 'Counter Offer Received';
        message = `The artisan has made a counter offer${finalPrice ? ` of $${finalPrice}` : ''}`;
        break;
    }

    await this.sendNotification({
      recipientId: customerId,
      senderId: artisanId,
      type: NotificationType.CUSTOM_ORDER,
      title,
      message,
      data: { customOrderId, action, finalPrice },
      actionUrl: `/customs/${customOrderId}`,
    });
  }

  async notifyCustomOrderCounterAccepted(
    customOrderId: string,
    customerId: string,
    artisanId: string,
  ): Promise<void> {
    await this.sendNotification({
      recipientId: artisanId,
      senderId: customerId,
      type: NotificationType.CUSTOM_ORDER,
      title: 'Counter Offer Accepted',
      message: 'Your counter offer has been accepted by the customer',
      data: { customOrderId, action: 'ACCEPT_COUNTER' },
      actionUrl: `/customs/${customOrderId}`,
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
    // Validate required parameters
    if (!customerId || !orderId) {
      this.logger.error(
        `notifyOrderCreated: Missing required parameters - customerId: ${customerId}, orderId: ${orderId}`,
      );
      throw new Error('Missing required parameters for order notification');
    }

    try {
      await this.sendNotification({
        recipientId: customerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Confirmed',
        message: 'Your order has been successfully created and confirmed',
        data: {
          orderId,
          action: 'CREATED',
          timestamp: new Date().toISOString(),
        },
        actionUrl: `/orders/${orderId}`,
      });

      this.logger.info(`Order creation notification sent to customer ${customerId}`);
    } catch (error) {
      this.logger.error(`Failed to notify order creation: ${error}`);
      throw error;
    }
  }

  async notifyNewOrderForSeller(sellerId: string, orderId: string): Promise<void> {
    // Validate required parameters
    if (!sellerId || !orderId) {
      this.logger.error(
        `notifyNewOrderForSeller: Missing required parameters - sellerId: ${sellerId}, orderId: ${orderId}`,
      );
      throw new Error('Missing required parameters for seller notification');
    }

    try {
      await this.sendNotification({
        recipientId: sellerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'New Order Received',
        message: 'You have received a new order that needs your attention',
        data: {
          orderId,
          action: 'NEW_ORDER',
          timestamp: new Date().toISOString(),
        },
        actionUrl: `/orders/${orderId}`,
      });

      this.logger.info(`New order notification sent to seller ${sellerId}`);
    } catch (error) {
      this.logger.error(`Failed to notify seller of new order: ${error}`);
      throw error;
    }
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

  // // DISPUTE NOTIFICATIONS
  // async notifyDisputeCreated(complainantId: string, disputeId: string): Promise<void> {
  //   await this.sendNotification({
  //     recipientId: complainantId,
  //     type: NotificationType.DISPUTE,
  //     title: 'Dispute Created',
  //     message: 'Your dispute has been submitted and is under review',
  //     data: { disputeId },
  //     actionUrl: `/disputes/${disputeId}`,
  //   });
  // }

  // async notifyDisputeUpdated(recipientId: string, disputeId: string): Promise<void> {
  //   await this.sendNotification({
  //     recipientId,
  //     type: NotificationType.DISPUTE,
  //     title: 'Dispute Update',
  //     message: 'There is an update on your dispute',
  //     data: { disputeId },
  //     actionUrl: `/disputes/${disputeId}`,
  //   });
  // }

  // // RETURN NOTIFICATIONS
  // async notifyReturnCreated(sellerId: string, returnId: string): Promise<void> {
  //   await this.sendNotification({
  //     recipientId: sellerId,
  //     type: NotificationType.RETURN,
  //     title: 'Return Request',
  //     message: 'A customer has requested a return for your order',
  //     data: { returnId },
  //     actionUrl: `/returns/${returnId}`,
  //   });
  // }

  // async notifyReturnUpdated(requesterId: string, returnId: string): Promise<void> {
  //   await this.sendNotification({
  //     recipientId: requesterId,
  //     type: NotificationType.RETURN,
  //     title: 'Return Update',
  //     message: 'There is an update on your return request',
  //     data: { returnId },
  //     actionUrl: `/returns/${returnId}`,
  //   });
  // }

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

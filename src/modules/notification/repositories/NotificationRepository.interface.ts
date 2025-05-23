import {
  Notification,
  NotificationWithSender,
  CreateNotificationDto,
  NotificationQueryOptions,
} from '../models/Notification';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface INotificationRepository {
  createNotification(data: CreateNotificationDto): Promise<Notification>;
  findById(id: string): Promise<NotificationWithSender | null>;
  getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<PaginatedResult<NotificationWithSender>>;
  markAsRead(id: string, userId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;
  deleteNotification(id: string, userId: string): Promise<boolean>;
  getUnreadCount(userId: string): Promise<number>;
  cleanupOldNotifications(days: number): Promise<number>;
}

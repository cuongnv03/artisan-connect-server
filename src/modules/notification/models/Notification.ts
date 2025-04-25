/**
 * Notification type enum
 */
export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  QUOTE_REQUEST = 'QUOTE_REQUEST',
  QUOTE_RESPONSE = 'QUOTE_RESPONSE',
  ORDER_STATUS = 'ORDER_STATUS',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
  NEW_POST = 'NEW_POST',
  SYSTEM = 'SYSTEM',
}

/**
 * Notification entity
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  data?: any | null;
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  readAt?: Date | null;
  createdAt: Date;
}

/**
 * Create notification DTO
 */
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: any;
  relatedUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

/**
 * Update notification DTO
 */
export interface UpdateNotificationDto {
  isRead?: boolean;
}

/**
 * Notification pagination result
 */
export interface NotificationPaginationResult {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

/**
 * Notification query options
 */
export interface NotificationQueryOptions {
  unreadOnly?: boolean;
  type?: NotificationType | NotificationType[];
  relatedEntityType?: string;
  page?: number;
  limit?: number;
}

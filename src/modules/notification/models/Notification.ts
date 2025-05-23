export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface CreateNotificationDto {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationQueryOptions {
  page?: number;
  limit?: number;
  isRead?: boolean;
  types?: NotificationType[];
  dateFrom?: Date;
  dateTo?: Date;
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  QUOTE_REQUEST = 'QUOTE_REQUEST',
  QUOTE_RESPONSE = 'QUOTE_RESPONSE',
  CUSTOM_ORDER = 'CUSTOM_ORDER',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
}

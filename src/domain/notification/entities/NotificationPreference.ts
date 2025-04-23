import { NotificationType } from './Notification';

/**
 * Notification preference entity
 */
export interface NotificationPreference {
  id: string;
  userId: string;
  type: NotificationType;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update notification preferences DTO
 */
export interface UpdatePreferencesDto {
  preferences: {
    type: NotificationType;
    enabled: boolean;
  }[];
}

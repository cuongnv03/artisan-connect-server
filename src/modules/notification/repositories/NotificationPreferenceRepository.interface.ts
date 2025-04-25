import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { NotificationPreference } from '../models/NotificationPreference';
import { NotificationType } from '../models/Notification';

export interface INotificationPreferenceRepository
  extends BaseRepository<NotificationPreference, string> {
  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): Promise<NotificationPreference[]>;

  /**
   * Get user preference for specific type
   */
  getUserPreference(userId: string, type: NotificationType): Promise<NotificationPreference | null>;

  /**
   * Update or create user preference
   */
  updateOrCreatePreference(
    userId: string,
    type: NotificationType,
    enabled: boolean,
  ): Promise<NotificationPreference>;

  /**
   * Initialize default preferences for a new user
   */
  initializeDefaultPreferences(userId: string): Promise<NotificationPreference[]>;
}

/**
 * Notification Module Exports
 */

// Export models
export * from './models/Notification';

// Export service interfaces
export * from './services/NotificationService.interface';

// Export repository interfaces
export * from './repositories/NotificationRepository.interface';

// Export validators
export * from './interface/validators/notification.validator';

// Export module registration function
export function registerNotificationModule() {
  console.log('Notification module registered');

  return {
    name: 'notification',
    description: 'Real-time notification system with Socket.io integration',
    version: '1.0.0',
    features: [
      'Real-time notifications via Socket.io',
      'Push notifications for mobile apps',
      'Notification preferences management',
      'Read/unread status tracking',
      'Bulk notification support',
      'Notification templates',
      'Auto cleanup of old notifications',
    ],
  };
}

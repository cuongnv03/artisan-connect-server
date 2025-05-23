/**
 * Messaging Module Exports
 */

// Export models
export * from './models/Message';

// Export service interfaces
export * from './services/MessageService.interface';

// Export repository interfaces
export * from './repositories/MessageRepository.interface';

// Export validators
export * from './interface/validators/message.validator';

// Export module registration function
export function registerMessagingModule() {
  console.log('Messaging module registered');

  return {
    name: 'messaging',
    description: 'Real-time messaging system with quote integration',
    version: '1.0.0',
    features: [
      'Real-time messaging via Socket.io',
      'Conversation management',
      'Read receipts and typing indicators',
      'Media file sharing',
      'Quote discussion integration',
      'Custom order negotiation',
      'Message templates',
      'Online/offline status',
    ],
  };
}

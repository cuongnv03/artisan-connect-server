/**
 * Custom Order Module Exports
 */

// Export models
export * from './models/CustomOrder';
export * from './models/CustomOrderEnums';

// Export service interfaces
export * from './services/CustomOrderService.interface';

// Export repository interfaces
export * from './repositories/CustomOrderRepository.interface';

// Export validators
export * from './interface/validators/custom-order.validator';

// Export module registration function
export function registerCustomOrderModule() {
  console.log('Custom Order module registered');

  return {
    name: 'custom-order',
    description: 'Complete custom order system for artisan marketplace',
    version: '1.0.0',
    features: [
      'Custom order requests with specifications',
      'Reference product linking',
      'File attachments support',
      'Artisan response system (accept/reject/counter)',
      'Real-time messaging integration',
      'Negotiation history tracking',
      'Order expiration management',
      'Role-based access control',
      'Analytics & statistics',
    ],
  };
}

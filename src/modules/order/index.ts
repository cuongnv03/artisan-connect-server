/**
 * Order Module Exports
 */

// Export models
export * from './models/Order';
export * from './models/OrderEnums';

// Export service interfaces
export * from './services/OrderService.interface';

// Export repository interfaces
export * from './repositories/OrderRepository.interface';

// Export validators
export * from './interface/validators/order.validator';

// Export module registration function
export function registerOrderModule() {
  console.log('Order module registered');

  return {
    name: 'order',
    description: 'Complete order management system for artisan marketplace',
    version: '2.0.0', // Updated version
    features: [
      'Order creation from cart',
      'Custom order creation from quotes',
      'Order status tracking with JSON history',
      'Payment processing simulation',
      'Multi-seller order support',
      'Delivery status tracking',
      // 'Order dispute management',
      // 'Return request management',
      'Role-based access control',
      'Order analytics & statistics',
      'Real-time notifications',
    ],
    newFeatures: [
      'Delivery status tracking',
      'Tax and discount calculation',
      'Order dispute system',
      'Return management system',
      'Enhanced status history (JSON)',
      'Buyer satisfaction tracking',
      'Return deadline management',
    ],
  };
}

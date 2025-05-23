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
    version: '1.0.0',
    features: [
      'Order creation from cart',
      'Custom order creation from quotes',
      'Order status tracking & history',
      'Payment processing simulation',
      'Multi-seller order support',
      'Role-based access control',
      'Order analytics & statistics',
    ],
  };
}

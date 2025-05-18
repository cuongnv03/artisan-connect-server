/**
 * Order Module Exports
 *
 * Centralized exports for the Order module to simplify imports
 */

// Export models
export * from './models/Order';
export * from './models/OrderItem';
export * from './models/OrderEnums';
export * from './models/OrderStatusHistory';

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
    description: 'Order management module for handling product orders and fulfillment',
  };
}

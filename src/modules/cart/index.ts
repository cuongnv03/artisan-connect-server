/**
 * Cart Module Exports
 */

// Export models
export * from './models/CartItem';

// Export service interfaces
export * from './services/CartService.interface';

// Export repository interfaces
export * from './repositories/CartRepository.interface';

// Export validators
export * from './interface/validators/cart.validator';

// Export module registration function
export function registerCartModule() {
  console.log('Cart module registered');

  return {
    name: 'cart',
    description: 'Simple shopping cart management for artisan marketplace',
    version: '1.0.0',
    features: [
      'Add/Remove/Update cart items',
      'Cart validation & calculation',
      'Multi-seller cart grouping',
      'Checkout validation',
      'Stock availability checking',
    ],
  };
}

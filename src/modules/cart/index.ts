/**
 * Cart Module Exports
 *
 * Centralized exports for the Cart module to simplify imports
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
    description: 'Shopping cart management module',
  };
}

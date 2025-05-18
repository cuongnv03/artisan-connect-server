/**
 * Product Module Exports
 *
 * Centralized exports for the Product module to simplify imports
 */

// Export models
export * from './models/Product';
export * from './models/Category';
export * from './models/ProductEnums';

// Export service interfaces
export * from './services/ProductService.interface';
export * from './services/CategoryService.interface';

// Export repository interfaces
export * from './repositories/ProductRepository.interface';
export * from './repositories/CategoryRepository.interface';

// Export validators
export * from './interface/validators/product.validator';
export * from './interface/validators/category.validator';

// Export module registration function
export function registerProductModule() {
  console.log('Product module registered');

  return {
    name: 'product',
    description: 'Product and category management module',
  };
}

/**
 * Review Module Exports
 *
 * Centralized exports for the Review module to simplify imports
 */

// Export models
export * from './models/Review';

// Export service interfaces
export * from './services/ReviewService.interface';

// Export repository interfaces
export * from './repositories/ReviewRepository.interface';

// Export validators
export * from './interface/validators/review.validator';

// Export module registration function
export function registerReviewModule() {
  console.log('Review module registered');

  return {
    name: 'review',
    description: 'Product review management module',
  };
}

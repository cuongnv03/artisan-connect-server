/**
 * Social Module Exports
 *
 * Centralized exports for the Social module
 */

// Export models
export * from './models/Like';
export * from './models/Comment';
export * from './models/Wishlist';

// Export service interfaces
export * from './services/LikeService.interface';
export * from './services/CommentService.interface';
export * from './services/WishlistService.interface';

// Export repository interfaces
export * from './repositories/LikeRepository.interface';
export * from './repositories/CommentRepository.interface';
export * from './repositories/WishlistRepository.interface';

// Export validators
export * from './interface/validators/like.validator';
export * from './interface/validators/comment.validator';
export * from './interface/validators/wishlist.validator';

// Export module registration function
export function registerSocialModule() {
  console.log('Social module registered');

  return {
    name: 'social',
    description: 'Social interactions module (like, comment, wishlist)',
  };
}

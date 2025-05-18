/**
 * Social Module Exports
 *
 * Centralized exports for the Social module to simplify imports
 */

// Export models
export * from './models/Follow';
export * from './models/Like';
export * from './models/Comment';
export * from './models/SavedPost';

// Export service interfaces
export * from './services/FollowService.interface';
export * from './services/LikeService.interface';
export * from './services/CommentService.interface';
export * from './services/SavedPostService.interface';

// Export repository interfaces
export * from './repositories/FollowRepository.interface';
export * from './repositories/LikeRepository.interface';
export * from './repositories/CommentRepository.interface';
export * from './repositories/SavedPostRepository.interface';

// Export validators
export * from './interface/validators/follow.validator';
export * from './interface/validators/like.validator';
export * from './interface/validators/comment.validator';
export * from './interface/validators/savedPost.validator';

// Export module registration function
export function registerSocialModule() {
  console.log('Social module registered');

  return {
    name: 'social',
    description: 'Social interactions module (follow, like, comment, save)',
  };
}

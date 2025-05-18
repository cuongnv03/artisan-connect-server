/**
 * Post Module Exports
 *
 * Centralized exports for the Post module to simplify imports
 */

// Export models
export * from './models/Post';

// Export service interfaces
export * from './services/PostService.interface';

// Export repository interfaces
export * from './repositories/PostRepository.interface';

// Export validators
export * from './interface/validators/post.validator';

// Export module registration function
export function registerPostModule() {
  console.log('Post module registered');

  return {
    name: 'post',
    description: 'Post management module for blog/content functionality',
  };
}

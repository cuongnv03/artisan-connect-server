/**
 * Profile Module Exports
 *
 * Centralized exports for the Profile module to simplify imports
 */

// Export models
export * from './models/Profile';
export * from './models/Address';

// Export service interfaces
export * from './services/ProfileService.interface';

// Export repository interfaces
export * from './repositories/ProfileRepository.interface';
export * from './repositories/AddressRepository.interface';

// Export validators
export * from './interface/validators/profile.validator';

// Export module registration function
export function registerProfileModule() {
  console.log('Profile module registered');

  return {
    name: 'profile',
    description: 'User profile and address management module',
  };
}

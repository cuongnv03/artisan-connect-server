/**
 * User Module Exports
 *
 * Centralized exports for the User module to simplify imports
 */

// Export models
export * from './models/Profile';
export * from './models/Address';
export * from './models/Follow';
export * from './models/UserDto';

// Export repository interfaces
export * from './repositories/ProfileRepository.interface';
export * from './repositories/AddressRepository.interface';
export * from './repositories/FollowRepository.interface';

// Export service interfaces
export * from './services/UserService.interface';

// Export validators
export * from './interface/validators/user.validator';

// Export module registration function
export function registerUserModule() {
  console.log('User module registered');

  return {
    name: 'user',
    description: 'User (Profile, Address, Follow) module',
  };
}

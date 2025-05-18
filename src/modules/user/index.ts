/**
 * User Module Exports
 *
 * Centralized exports for the User module to simplify imports
 */

// Export models
export * from './models/User';
export * from './models/UserEnums';
export * from './models/RefreshToken';
export * from './models/AuthDto';
export * from './models/EmailVerification';
export * from './models/PasswordReset';

// Export service interfaces
export * from './services/AuthService.interface';
export * from './services/UserService.interface';

// Export repository interfaces
export * from './repositories/UserRepository.interface';
export * from './repositories/RefreshTokenRepository.interface';
export * from './repositories/EmailVerificationRepository.interface';
export * from './repositories/PasswordResetRepository.interface';

// Export validators if needed
export * from './interface/validators/auth.validator';
export * from './interface/validators/user.validator';

// Export module registration function (optional)
export function registerUserModule() {
  // This function could be used to register routes or perform other module initialization
  // if you want to make module registration more explicit
  console.log('User module registered');

  // Could return routes or other module-specific configurations
  return {
    name: 'user',
    description: 'User authentication and management module',
  };
}

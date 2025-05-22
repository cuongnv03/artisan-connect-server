/**
 * Auth Module Exports
 *
 * Centralized exports for the Auth module to simplify imports
 */

// Export models
export * from './models/User';
export * from './models/UserEnums';
export * from './models/AuthDto';
export * from './models/RefreshToken';
export * from './models/PasswordReset';
export * from './models/EmailVerification';

// Export repository interfaces
export * from './repositories/UserRepository.interface';
export * from './repositories/RefreshTokenRepository.interface';
export * from './repositories/PasswordResetRepository.interface';
export * from './repositories/EmailVerificationRepository.interface';

// Export service interfaces
export * from './services/AuthService.interface';

// Export validators
export * from './interface/validators/auth.validator';

// Export module registration function
export function registerAuthModule() {
  console.log('Auth module registered');

  return {
    name: 'auth',
    description: 'Authentication and authorization module',
  };
}

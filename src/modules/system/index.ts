/**
 * System Module Exports
 *
 * Centralized exports for the System module to simplify imports
 */

// Export models
export * from './models/SystemConfig';

// Export service interfaces
export * from './services/SystemConfigService.interface';

// Export repository interfaces
export * from './repositories/SystemConfigRepository.interface';

// Export validators
export * from './interface/validators/system-config.validator';

// Export module registration function
export function registerSystemModule() {
  console.log('System module registered');

  return {
    name: 'system',
    description: 'System configuration management module',
  };
}

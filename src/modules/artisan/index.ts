/**
 * Artisan Module Exports
 *
 * Centralized exports for the Artisan module to simplify imports
 */

// Export models
export * from './models/ArtisanProfile';
export * from './models/ArtisanEnums';
export * from './models/ArtisanUpgradeRequest';

// Export repository interfaces
export * from './repositories/ArtisanProfileRepository.interface';
export * from './repositories/UpgradeRequestRepository.interface';

// Export service interfaces
export * from './services/ArtisanProfileService.interface';

// Export validators
export * from './interface/validators/artisan.validator';

// Export module registration function
export function registerArtisanModule() {
  console.log('Artisan module registered');

  return {
    name: 'artisan',
    description: 'Artisan module',
  };
}

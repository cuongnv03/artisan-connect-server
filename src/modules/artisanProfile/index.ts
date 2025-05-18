/**
 * ArtisanProfile Module Exports
 *
 * Centralized exports for the ArtisanProfile module to simplify imports
 */

// Export models
export * from './models/ArtisanProfile';
export * from './models/ArtisanProfileEnums';
export * from './models/ArtisanUpgradeRequest';

// Export service interfaces
export * from './services/ArtisanProfileService.interface';

// Export repository interfaces
export * from './repositories/ArtisanProfileRepository.interface';
export * from './repositories/UpgradeRequestRepository.interface';

// Export validators
export * from './interface/validators/artisanProfile.validator';

// Export module registration function
export function registerArtisanProfileModule() {
  console.log('ArtisanProfile module registered');

  return {
    name: 'artisanProfile',
    description: 'Artisan profile management and upgrade request handling',
  };
}

/**
 * Analytics Module Exports
 */

// Export models
export * from './models/AnalyticsDto';

// Export repository interfaces
export * from './repositories/AnalyticsRepository.interface';

// Export service interfaces
export * from './services/AnalyticsService.interface';

// Export module registration function
export function registerAnalyticsModule() {
  console.log('Analytics module registered');

  return {
    name: 'analytics',
    description: 'Analytics and reporting module',
  };
}

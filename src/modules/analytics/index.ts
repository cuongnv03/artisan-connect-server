/**
 * Analytics Module Exports
 *
 * Centralized exports for the Analytics module to simplify imports
 */

// Export models
export * from './models/PostAnalytics';

// Export service interfaces
export * from './services/PostAnalyticsService.interface';

// Export repository interfaces
export * from './repositories/PostAnalyticsRepository.interface';

// Export validators
export * from './interface/validators/analytics.validator';

// Export module registration function
export function registerAnalyticsModule() {
  console.log('Analytics module registered');

  return {
    name: 'analytics',
    description: 'Analytics tracking and reporting module',
  };
}

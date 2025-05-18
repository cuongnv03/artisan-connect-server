/**
 * Quote Module Exports
 *
 * Centralized exports for the Quote module to simplify imports
 */

// Export models
export * from './models/QuoteRequest';
export * from './models/QuoteMessage';
export * from './models/QuoteEnums';

// Export service interfaces
export * from './services/QuoteService.interface';

// Export repository interfaces
export * from './repositories/QuoteRepository.interface';

// Export validators
export * from './interface/validators/quote.validator';

// Export module registration function
export function registerQuoteModule() {
  console.log('Quote module registered');

  return {
    name: 'quote',
    description: 'Product quote request management module',
  };
}

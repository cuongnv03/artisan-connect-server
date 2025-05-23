/**
 * Quote Module Exports
 */

// Export models
export * from './models/Quote';
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
    description: 'Complete quote & negotiation system for custom artisan products',
    version: '1.0.0',
    features: [
      'Quote request creation for customizable products',
      'Artisan response system (accept/reject/counter)',
      'Real-time negotiation with messaging',
      'Quote expiration management',
      'Negotiation history tracking',
      'Role-based access control',
      'Quote statistics & analytics',
      'Integration with order system',
    ],
  };
}

/**
 * Price Negotiation Module Exports
 */

// Export models
export * from './models/PriceNegotiation';
export * from './models/PriceNegotiationEnums';

// Export service interfaces
export * from './services/PriceNegotiationService.interface';

// Export repository interfaces
export * from './repositories/PriceNegotiationRepository.interface';

// Export validators
export * from './interface/validators/negotiation.validator';

// Export module registration function
export function registerPriceNegotiationModule() {
  console.log('Price Negotiation module registered');

  return {
    name: 'price-negotiation',
    description: 'Price negotiation system for existing products',
    version: '1.0.0',
    features: [
      'Price negotiation for existing products',
      'Artisan response system (accept/reject/counter)',
      'Negotiation history tracking',
      'Automatic expiration management',
      'Real-time notifications',
      'Role-based access control',
      'Negotiation statistics & analytics',
      'Integration with product system',
    ],
  };
}

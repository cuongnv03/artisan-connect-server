export interface QuoteNegotiationHistory {
  id: string;
  quoteId: string;
  action: string;
  actor: 'customer' | 'artisan';
  previousPrice?: number;
  newPrice?: number;
  message?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface CreateNegotiationEntryDto {
  action: string;
  actor: 'customer' | 'artisan';
  previousPrice?: number;
  newPrice?: number;
  message?: string;
  metadata?: Record<string, any>;
}

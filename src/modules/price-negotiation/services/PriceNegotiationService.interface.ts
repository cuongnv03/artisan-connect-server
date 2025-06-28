import {
  PriceNegotiation,
  PriceNegotiationWithDetails,
  NegotiationSummary,
  CreateNegotiationDto,
  RespondToNegotiationDto,
  NegotiationQueryOptions,
  NegotiationStats,
} from '../models/PriceNegotiation';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IPriceNegotiationService {
  // Negotiation creation & management
  createNegotiation(
    customerId: string,
    data: CreateNegotiationDto,
  ): Promise<PriceNegotiationWithDetails>;
  respondToNegotiation(
    negotiationId: string,
    artisanId: string,
    data: RespondToNegotiationDto,
  ): Promise<PriceNegotiationWithDetails>;

  // Negotiation retrieval
  getNegotiationById(id: string): Promise<PriceNegotiationWithDetails | null>;

  // NEW: Specific methods for sent/received
  getCustomerNegotiations(
    customerId: string,
    options?: Partial<NegotiationQueryOptions>,
  ): Promise<PaginatedResult<NegotiationSummary>>;

  getArtisanNegotiations(
    artisanId: string,
    options?: Partial<NegotiationQueryOptions>,
  ): Promise<PaginatedResult<NegotiationSummary>>;

  // Negotiation status management
  cancelNegotiation(
    negotiationId: string,
    userId: string,
    reason?: string,
  ): Promise<PriceNegotiationWithDetails>;

  // Validation & utilities
  validateNegotiationAccess(
    negotiationId: string,
    userId: string,
    action?: string,
  ): Promise<boolean>;
  getNegotiationStats(userId?: string, type?: 'sent' | 'received'): Promise<NegotiationStats>;
  checkExistingNegotiation(
    customerId: string,
    productId: string,
    variantId?: string,
  ): Promise<{
    hasActive: boolean;
    negotiation?: PriceNegotiationWithDetails;
  }>;

  // Background tasks
  expireOldNegotiations(): Promise<number>;
}

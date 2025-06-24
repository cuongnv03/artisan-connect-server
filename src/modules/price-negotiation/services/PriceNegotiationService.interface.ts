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
  getNegotiations(options?: NegotiationQueryOptions): Promise<PaginatedResult<NegotiationSummary>>;
  getMyNegotiations(
    userId: string,
    userRole: string,
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
  getNegotiationStats(userId?: string, userRole?: string): Promise<NegotiationStats>;
  checkExistingNegotiation(
    customerId: string,
    productId: string,
    variantId?: string, // NEW
  ): Promise<{
    hasActive: boolean;
    negotiation?: PriceNegotiationWithDetails;
  }>;

  // Background tasks
  expireOldNegotiations(): Promise<number>;
}

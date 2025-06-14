import {
  PriceNegotiation,
  PriceNegotiationWithDetails,
  NegotiationSummary,
  CreateNegotiationDto,
  RespondToNegotiationDto,
  NegotiationQueryOptions,
  NegotiationStats,
} from '../models/PriceNegotiation';
import { NegotiationStatus } from '../models/PriceNegotiationEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { BaseRepository } from '../../../shared/interfaces/BaseRepository';

export interface IPriceNegotiationRepository extends BaseRepository<PriceNegotiation, string> {
  // Negotiation creation & management
  createNegotiation(
    customerId: string,
    data: CreateNegotiationDto,
  ): Promise<PriceNegotiationWithDetails>;
  respondToNegotiation(
    id: string,
    artisanId: string,
    data: RespondToNegotiationDto,
  ): Promise<PriceNegotiationWithDetails>;

  // Negotiation retrieval
  findByIdWithDetails(id: string): Promise<PriceNegotiationWithDetails | null>;
  getNegotiations(options: NegotiationQueryOptions): Promise<PaginatedResult<NegotiationSummary>>;
  getCustomerNegotiations(
    customerId: string,
    options?: Partial<NegotiationQueryOptions>,
  ): Promise<PaginatedResult<NegotiationSummary>>;
  getArtisanNegotiations(
    artisanId: string,
    options?: Partial<NegotiationQueryOptions>,
  ): Promise<PaginatedResult<NegotiationSummary>>;

  // Negotiation status management
  updateNegotiationStatus(
    id: string,
    status: NegotiationStatus,
    finalPrice?: number,
  ): Promise<PriceNegotiationWithDetails>;
  expireNegotiations(): Promise<number>;

  // Validation & utilities
  isUserInvolvedInNegotiation(negotiationId: string, userId: string): Promise<boolean>;
  canUserRespondToNegotiation(negotiationId: string, userId: string): Promise<boolean>;
  hasActiveNegotiation(customerId: string, productId: string): Promise<boolean>;
  getNegotiationStats(userId?: string, role?: string): Promise<NegotiationStats>;
}

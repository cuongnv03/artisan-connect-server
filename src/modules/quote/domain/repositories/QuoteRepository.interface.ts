import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import {
  QuoteRequest,
  QuoteRequestWithDetails,
  CreateQuoteRequestDto,
  QuoteRequestQueryOptions,
} from '../entities/QuoteRequest';
import { QuoteMessage } from '../entities/QuoteMessage';
import { QuoteStatus } from '../valueObjects/QuoteEnums';
import { PaginatedResult } from '../../../../shared/interfaces/PaginatedResult';

export interface IQuoteRepository extends BaseRepository<QuoteRequest, string> {
  /**
   * Find quote request by ID with details
   */
  findByIdWithDetails(id: string): Promise<QuoteRequestWithDetails | null>;

  /**
   * Create a new quote request
   */
  createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails>;

  /**
   * Get quote requests with filtering and pagination
   */
  getQuoteRequests(
    options: QuoteRequestQueryOptions,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>>;

  /**
   * Update quote request status
   */
  updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    data?: { counterOffer?: number; finalPrice?: number },
  ): Promise<QuoteRequestWithDetails>;

  /**
   * Add message to quote
   */
  addMessageToQuote(quoteId: string, userId: string, message: string): Promise<QuoteMessage>;

  /**
   * Check if user is involved in quote
   */
  isUserInvolved(quoteId: string, userId: string): Promise<boolean>;

  /**
   * Mark quote request as expired
   */
  markExpiredQuotes(): Promise<number>;

  /**
   * Delete a quote request
   */
  deleteQuoteRequest(id: string): Promise<boolean>;
}

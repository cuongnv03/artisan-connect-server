import {
  QuoteRequest,
  QuoteRequestWithDetails,
  CreateQuoteRequestDto,
  RespondToQuoteDto,
  AddQuoteMessageDto,
  QuoteRequestQueryOptions,
} from '../../../domain/quote/entities/QuoteRequest';
import { QuoteMessage } from '../../../domain/quote/entities/QuoteMessage';
import { QuoteStatus } from '../../../domain/quote/valueObjects/QuoteEnums';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';

export interface IQuoteService {
  /**
   * Create a new quote request
   */
  createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails>;

  /**
   * Get quote request by ID
   */
  getQuoteRequestById(id: string): Promise<QuoteRequestWithDetails | null>;

  /**
   * Get quote requests with filtering
   */
  getQuoteRequests(
    options: QuoteRequestQueryOptions,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>>;

  /**
   * Get customer quote requests
   */
  getCustomerQuoteRequests(
    customerId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>>;

  /**
   * Get artisan quote requests
   */
  getArtisanQuoteRequests(
    artisanId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>>;

  /**
   * Respond to quote request
   */
  respondToQuoteRequest(
    quoteId: string,
    artisanId: string,
    response: RespondToQuoteDto,
  ): Promise<QuoteRequestWithDetails>;

  /**
   * Add message to quote
   */
  addMessageToQuote(
    quoteId: string,
    userId: string,
    data: AddQuoteMessageDto,
  ): Promise<QuoteMessage>;

  /**
   * Cancel quote request
   */
  cancelQuoteRequest(quoteId: string, userId: string): Promise<QuoteRequestWithDetails>;

  /**
   * Clean up expired quotes
   */
  cleanupExpiredQuotes(): Promise<number>;

  /**
   * Update quote status
   */
  updateQuoteStatus(quoteId: string, status: QuoteStatus): Promise<QuoteRequestWithDetails>;
}

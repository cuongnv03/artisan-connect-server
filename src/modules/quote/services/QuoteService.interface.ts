import {
  QuoteRequest,
  QuoteRequestWithDetails,
  QuoteSummary,
  QuoteNegotiation,
  CreateQuoteRequestDto,
  RespondToQuoteDto,
  AddQuoteMessageDto,
  QuoteQueryOptions,
  QuoteStats,
} from '../models/Quote';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IQuoteService {
  // Quote creation & management
  createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails>;
  respondToQuote(
    quoteId: string,
    artisanId: string,
    data: RespondToQuoteDto,
  ): Promise<QuoteRequestWithDetails>;

  // Quote retrieval
  getQuoteById(id: string): Promise<QuoteRequestWithDetails | null>;
  getQuotes(options?: QuoteQueryOptions): Promise<PaginatedResult<QuoteSummary>>;
  getMyQuoteRequests(
    userId: string,
    userRole: string,
    options?: Partial<QuoteQueryOptions>,
  ): Promise<PaginatedResult<QuoteSummary>>;

  // Quote messaging & negotiation
  addMessageToQuote(
    quoteId: string,
    userId: string,
    message: string,
  ): Promise<QuoteRequestWithDetails>;
  getNegotiationHistory(quoteId: string): Promise<QuoteNegotiation[]>;

  // Quote status management
  cancelQuoteRequest(
    quoteId: string,
    userId: string,
    reason?: string,
  ): Promise<QuoteRequestWithDetails>;

  // Validation & utilities
  validateQuoteAccess(quoteId: string, userId: string, action?: string): Promise<boolean>;
  getQuoteStats(userId?: string, userRole?: string): Promise<QuoteStats>;

  // Background tasks
  expireOldQuotes(): Promise<number>;
}

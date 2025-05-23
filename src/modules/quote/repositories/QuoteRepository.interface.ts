import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
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
import { QuoteStatus, QuoteAction } from '../models/QuoteEnums';
import {
  CreateNegotiationEntryDto,
  QuoteNegotiationHistory,
} from '../models/QuoteNegotiationHistory';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IQuoteRepository extends BaseRepository<QuoteRequest, string> {
  // Quote creation & management
  createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails>;
  respondToQuote(
    id: string,
    artisanId: string,
    data: RespondToQuoteDto,
  ): Promise<QuoteRequestWithDetails>;

  // Quote retrieval
  findByIdWithDetails(id: string): Promise<QuoteRequestWithDetails | null>;
  getQuotes(options: QuoteQueryOptions): Promise<PaginatedResult<QuoteSummary>>;
  getCustomerQuotes(
    customerId: string,
    options?: Partial<QuoteQueryOptions>,
  ): Promise<PaginatedResult<QuoteSummary>>;
  getArtisanQuotes(
    artisanId: string,
    options?: Partial<QuoteQueryOptions>,
  ): Promise<PaginatedResult<QuoteSummary>>;

  // Quote messaging & negotiation
  addMessage(id: string, data: AddQuoteMessageDto): Promise<QuoteRequestWithDetails>;
  getNegotiationHistory(id: string): Promise<QuoteNegotiation[]>;
  createNegotiationEntry(
    quoteId: string,
    data: CreateNegotiationEntryDto,
  ): Promise<QuoteNegotiationHistory>;

  // Quote status management
  updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    finalPrice?: number,
  ): Promise<QuoteRequestWithDetails>;
  markAsCompleted(id: string): Promise<QuoteRequestWithDetails>;
  expireQuotes(): Promise<number>;

  // Validation & utilities
  isUserInvolvedInQuote(quoteId: string, userId: string): Promise<boolean>;
  canUserRespondToQuote(quoteId: string, userId: string): Promise<boolean>;
  getQuoteStats(userId?: string, role?: string): Promise<QuoteStats>;
}

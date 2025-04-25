import { QuoteStatus } from '../valueObjects/QuoteEnums';
import { QuoteMessage } from './QuoteMessage';

/**
 * Quote request entity
 */
export interface QuoteRequest {
  id: string;
  productId: string;
  customerId: string;
  artisanId: string;
  requestedPrice: number | null;
  specifications: string | null;
  status: QuoteStatus;
  counterOffer: number | null;
  finalPrice: number | null;
  messages: QuoteMessage[];
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quote request with related details
 */
export interface QuoteRequestWithDetails extends QuoteRequest {
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  artisan: {
    id: string;
    firstName: string;
    lastName: string;
    artisanProfile?: {
      shopName: string;
    } | null;
  };
}

/**
 * Create quote request DTO
 */
export interface CreateQuoteRequestDto {
  productId: string;
  requestedPrice?: number;
  specifications?: string;
  expiresInDays?: number; // How many days until the quote expires
}

/**
 * Response to quote DTO
 */
export interface RespondToQuoteDto {
  action: 'accept' | 'reject' | 'counter';
  counterOffer?: number; // Required if action is 'counter'
  message?: string; // Optional message with the response
}

/**
 * Add message to quote DTO
 */
export interface AddQuoteMessageDto {
  message: string;
}

/**
 * Quote request query options
 */
export interface QuoteRequestQueryOptions {
  status?: QuoteStatus | QuoteStatus[];
  customerId?: string;
  artisanId?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

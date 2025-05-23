import { QuoteStatus, QuoteAction } from './QuoteEnums';

export interface QuoteRequest {
  id: string;
  productId: string;
  customerId: string;
  artisanId: string;
  requestedPrice?: number;
  specifications?: string;
  status: QuoteStatus;
  counterOffer?: number;
  finalPrice?: number;
  customerMessage?: string;
  artisanMessage?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteRequestWithDetails extends QuoteRequest {
  product: {
    id: string;
    name: string;
    slug?: string;
    images: string[];
    price: number;
    discountPrice?: number;
    isCustomizable: boolean;
    status: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatarUrl?: string;
  };
  artisan: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
      rating?: number;
    };
  };
  negotiationHistory: QuoteNegotiation[];
}

export interface QuoteNegotiation {
  id: string;
  action: QuoteAction;
  actor: 'customer' | 'artisan';
  previousPrice?: number;
  newPrice?: number;
  message?: string;
  timestamp: Date;
}

// DTOs
export interface CreateQuoteRequestDto {
  productId: string;
  requestedPrice?: number;
  specifications?: string;
  message?: string;
  expiresInDays?: number;
}

export interface RespondToQuoteDto {
  action: QuoteAction;
  counterOffer?: number;
  message?: string;
}

export interface AddQuoteMessageDto {
  message: string;
  isCustomerMessage: boolean;
}

export interface QuoteQueryOptions {
  page?: number;
  limit?: number;
  customerId?: string;
  artisanId?: string;
  productId?: string;
  status?: QuoteStatus | QuoteStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuoteSummary {
  id: string;
  productName: string;
  productImages: string[];
  status: QuoteStatus;
  requestedPrice?: number;
  counterOffer?: number;
  finalPrice?: number;
  createdAt: Date;
  expiresAt?: Date;
  customer?: {
    id: string;
    name: string;
    username: string;
  };
  artisan?: {
    id: string;
    name: string;
    shopName?: string;
  };
}

export interface QuoteStats {
  totalQuotes: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  averageNegotiationTime: number; // in hours
  conversionRate: number; // percentage of quotes that became orders
}

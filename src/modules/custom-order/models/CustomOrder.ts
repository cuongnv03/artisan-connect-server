import { QuoteStatus } from './CustomOrderEnums';

export interface CustomOrderRequest {
  id: string;
  customerId: string;
  artisanId: string;
  title: string;
  description: string;
  referenceProductId?: string | null;
  specifications?: any | null; // Json
  attachmentUrls: string[];
  estimatedPrice?: number | null;
  customerBudget?: number | null;
  timeline?: string | null;
  status: QuoteStatus;
  artisanResponse?: any | null; // Json
  finalPrice?: number | null;
  negotiationHistory?: any | null; // Json
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomOrderWithDetails extends CustomOrderRequest {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
  };
  artisan: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
      rating?: number | null;
    } | null;
  };
  referenceProduct?: {
    id: string;
    name: string;
    slug?: string | null;
    images: string[];
    price: number;
    isCustomizable: boolean;
  } | null;
  messages: CustomOrderMessage[];
}

export interface CustomOrderMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments: string[];
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
  };
}

// DTOs
export interface CreateCustomOrderDto {
  artisanId: string;
  title: string;
  description: string;
  referenceProductId?: string;
  specifications?: any;
  attachmentUrls?: string[];
  estimatedPrice?: number;
  customerBudget?: number;
  timeline?: string;
  expiresInDays?: number;
}

export interface ArtisanResponseDto {
  action: 'ACCEPT' | 'REJECT' | 'COUNTER_OFFER';
  finalPrice?: number;
  response?: any; // Json với message, modifications, etc.
  expiresInDays?: number;
}

export interface UpdateCustomOrderDto {
  title?: string;
  description?: string;
  specifications?: any;
  attachmentUrls?: string[];
  estimatedPrice?: number;
  customerBudget?: number;
  timeline?: string;
}

export interface CustomOrderQueryOptions {
  page?: number;
  limit?: number;
  customerId?: string;
  artisanId?: string;
  status?: QuoteStatus | QuoteStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomOrderStats {
  totalRequests: number;
  pendingRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  averageResponseTime: number; // in hours
  conversionRate: number; // percentage converted to orders
}

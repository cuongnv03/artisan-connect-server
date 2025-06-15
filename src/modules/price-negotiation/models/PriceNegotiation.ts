import { NegotiationStatus } from './PriceNegotiationEnums';

export interface PriceNegotiation {
  id: string;
  productId: string;
  customerId: string;
  artisanId: string;
  originalPrice: number; // Decimal converted to number
  proposedPrice: number; // Decimal converted to number
  finalPrice?: number | null; // Decimal converted to number
  quantity: number;
  customerReason?: string | null;
  status: NegotiationStatus;
  artisanResponse?: string | null;
  negotiationHistory?: any; // Json field
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceNegotiationWithDetails extends PriceNegotiation {
  product: {
    id: string;
    name: string;
    slug?: string | null;
    images: string[];
    price: number;
    discountPrice?: number | null;
    quantity: number;
    allowNegotiation: boolean;
    status: string;
    seller: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      avatarUrl?: string | null;
      artisanProfile?: {
        shopName: string;
        isVerified: boolean;
      } | null;
    };
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
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
    } | null;
  };
}

// DTOs
export interface CreateNegotiationDto {
  productId: string;
  proposedPrice: number;
  quantity?: number;
  customerReason?: string;
  expiresInDays?: number;
}

export interface RespondToNegotiationDto {
  action: 'ACCEPT' | 'REJECT' | 'COUNTER';
  counterPrice?: number;
  artisanResponse?: string;
}

export interface NegotiationQueryOptions {
  page?: number;
  limit?: number;
  customerId?: string;
  artisanId?: string;
  productId?: string;
  status?: NegotiationStatus | NegotiationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NegotiationSummary {
  id: string;
  productName: string;
  productImages: string[];
  originalPrice: number;
  proposedPrice: number;
  finalPrice?: number | null;
  quantity: number;
  status: NegotiationStatus;
  createdAt: Date;
  expiresAt?: Date | null;
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

export interface NegotiationStats {
  totalNegotiations: number;
  pendingNegotiations: number;
  acceptedNegotiations: number;
  rejectedNegotiations: number;
  expiredNegotiations: number;
  averageDiscount: number; // percentage
  successRate: number; // percentage of accepted negotiations
}

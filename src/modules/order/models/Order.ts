import {
  OrderStatus,
  PaymentStatus,
  PaymentMethodType,
  DeliveryStatus,
  DisputeType,
  DisputeStatus,
  ReturnReason,
  ReturnStatus,
} from './OrderEnums';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number; // Decimal converted to number
  subtotal: number; // Decimal converted to number
  shippingCost: number; // Decimal converted to number
  taxAmount?: number | null; // Decimal converted to number
  discountAmount?: number | null; // Decimal converted to number
  paymentMethod?: PaymentMethodType | null;
  paymentReference?: string | null;
  deliveryStatus: DeliveryStatus;
  expectedDelivery?: Date | null;
  actualDelivery?: Date | null;
  isDeliveryLate: boolean;
  deliveryNotes?: string | null;
  trackingNumber?: string | null;
  canReturn: boolean;
  returnDeadline?: Date | null;
  hasDispute: boolean;
  isRated: boolean;
  buyerSatisfaction?: number | null;
  notes?: string | null;
  statusHistory?: any; // Json field
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  shippingAddress?: {
    id: string;
    fullName: string;
    phone?: string | null;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  items: OrderItemWithDetails[];
  paymentTransactions: PaymentTransaction[];
  disputes: OrderDispute[];
  returns: OrderReturn[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  sellerId: string;
  quantity: number;
  price: number; // Decimal converted to number
  createdAt: Date;
}

export interface OrderItemWithDetails extends OrderItem {
  product?: {
    id: string;
    name: string;
    slug?: string | null;
    images: string[];
  } | null; // Make optional
  variant?: {
    id: string;
    sku: string;
    name?: string | null;
    attributes: Record<string, any>;
  } | null;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    } | null;
  };
  customOrder?: {
    id: string;
    title: string;
    description: string;
  } | null;
  isCustomOrder: boolean;
  customTitle?: string | null;
  customDescription?: string | null;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  paymentMethodId?: string | null;
  amount: number; // Decimal converted to number
  currency: string;
  status: PaymentStatus;
  paymentMethodType: PaymentMethodType;
  reference: string;
  externalReference?: string | null;
  failureReason?: string | null;
  metadata?: any; // Json
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Dispute models
export interface OrderDispute {
  id: string;
  orderId: string;
  complainantId: string;
  type: DisputeType;
  reason: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDisputeWithDetails extends OrderDispute {
  order: {
    id: string;
    orderNumber: string;
  };
  complainant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Return models
export interface OrderReturn {
  id: string;
  orderId: string;
  requesterId: string;
  reason: ReturnReason;
  description?: string | null;
  evidence: string[];
  status: ReturnStatus;
  approvedBy?: string | null;
  refundAmount?: number | null; // Decimal converted to number
  refundReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderReturnWithDetails extends OrderReturn {
  order: {
    id: string;
    orderNumber: string;
  };
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// DTOs
export interface CreateOrderFromCartDto {
  addressId: string;
  paymentMethod: PaymentMethodType;
  notes?: string;
}

export interface CreateOrderFromQuoteDto {
  quoteRequestId: string;
  addressId: string;
  paymentMethod: PaymentMethodType;
  notes?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  note?: string;
  estimatedDelivery?: Date;
}

export interface ProcessPaymentDto {
  paymentMethodId?: string;
  paymentReference?: string;
  externalReference?: string;
}

export interface OrderQueryOptions {
  page?: number;
  limit?: number;
  userId?: string;
  sellerId?: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  deliveryStatus?: DeliveryStatus | DeliveryStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  primarySeller?: {
    id: string;
    name: string;
    shopName?: string;
  };
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Dispute DTOs
export interface CreateDisputeDto {
  orderId: string;
  type: DisputeType;
  reason: string;
  evidence?: string[];
}

export interface UpdateDisputeDto {
  status: DisputeStatus;
  resolution?: string;
}

// Return DTOs
export interface CreateReturnDto {
  orderId: string;
  reason: ReturnReason;
  description?: string;
  evidence?: string[];
}

export interface UpdateReturnDto {
  status: ReturnStatus;
  refundAmount?: number;
  refundReason?: string;
}

// Query options cho dispute và return
export interface DisputeQueryOptions {
  page?: number;
  limit?: number;
  status?: DisputeStatus;
  type?: DisputeType;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReturnQueryOptions {
  page?: number;
  limit?: number;
  status?: ReturnStatus;
  reason?: ReturnReason;
  dateFrom?: Date;
  dateTo?: Date;
}

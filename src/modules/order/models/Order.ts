import { OrderStatus, PaymentMethod, PaymentStatus } from './OrderEnums';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shippingAddress?: {
    id: string;
    fullName: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItemWithDetails[];
  statusHistory: OrderStatusHistory[];
  paymentTransactions: PaymentTransaction[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  sellerId: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface OrderItemWithDetails extends OrderItem {
  product: {
    id: string;
    name: string;
    slug?: string;
    images: string[];
    isCustomizable: boolean;
  };
  variant?: {
    id: string;
    sku: string;
    name?: string;
    attributes: Array<{
      key: string;
      name: string;
      value: string;
    }>;
  };
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    };
  };
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  paymentMethodId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  reference: string;
  externalReference?: string;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateOrderFromCartDto {
  addressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CreateOrderFromQuoteDto {
  quoteRequestId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
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

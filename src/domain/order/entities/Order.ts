import { OrderStatus, PaymentMethod, PaymentStatus } from '../valueObjects/OrderEnums';
import { OrderItem } from './OrderItem';
import { OrderStatusHistory } from './OrderStatusHistory';

/**
 * Order entity
 */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId?: string | null;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  paymentMethod?: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string | null;
  quoteRequestId?: string | null;
  notes?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order with detailed information
 */
export interface OrderWithDetails extends Order {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  shippingAddress?: {
    id: string;
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string | null;
  } | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  quoteRequest?: {
    id: string;
    finalPrice: number;
    specifications?: string | null;
  } | null;
}

/**
 * Create order from cart DTO
 */
export interface CreateOrderFromCartDto {
  addressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  appliedCouponCode?: string;
}

/**
 * Create order from quote DTO
 */
export interface CreateOrderFromQuoteDto {
  quoteRequestId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Update order status DTO
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
  note?: string;
}

/**
 * Update shipping info DTO
 */
export interface UpdateShippingInfoDto {
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
}

/**
 * Order query options
 */
export interface OrderQueryOptions {
  userId?: string;
  status?: OrderStatus | OrderStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeCancelled?: boolean;
}

/**
 * Order summary DTO (for listings)
 */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  sellerInfo?: {
    id: string;
    name: string;
    shopName?: string;
  };
}

/**
 * Convert quote to order DTO
 */
export interface ConvertToOrderDto {
  shippingAddressId?: string;
  paymentMethod?: string;
  notes?: string;
}

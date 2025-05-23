import {
  Order,
  OrderWithDetails,
  OrderSummary,
  OrderStatusHistory,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  ProcessPaymentDto,
  OrderQueryOptions,
  OrderStats,
} from '../models/Order';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IOrderService {
  // Order creation
  createOrderFromCart(userId: string, data: CreateOrderFromCartDto): Promise<OrderWithDetails>;
  createOrderFromQuote(userId: string, data: CreateOrderFromQuoteDto): Promise<OrderWithDetails>;

  // Order retrieval
  getOrderById(id: string): Promise<OrderWithDetails | null>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithDetails | null>;
  getOrders(options?: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>>;
  getMyOrders(
    userId: string,
    options?: Partial<OrderQueryOptions>,
  ): Promise<PaginatedResult<OrderSummary>>;
  getSellerOrders(
    sellerId: string,
    options?: Partial<OrderQueryOptions>,
  ): Promise<PaginatedResult<OrderSummary>>;

  // Order management
  updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<OrderWithDetails>;
  cancelOrder(id: string, userId: string, reason?: string): Promise<OrderWithDetails>;

  // Payment
  processPayment(id: string, data: ProcessPaymentDto): Promise<OrderWithDetails>;
  refundPayment(id: string, reason?: string): Promise<OrderWithDetails>;

  // Tracking
  getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]>;

  // Analytics
  getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats>;

  // Validation
  validateOrderAccess(orderId: string, userId: string, userRole: string): Promise<boolean>;
}

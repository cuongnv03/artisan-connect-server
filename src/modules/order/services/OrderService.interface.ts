import {
  Order,
  OrderWithDetails,
  OrderSummary,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  ProcessPaymentDto,
  OrderQueryOptions,
  OrderStats,
  OrderDispute,
  OrderDisputeWithDetails,
  CreateDisputeDto,
  UpdateDisputeDto,
  DisputeQueryOptions,
  OrderReturn,
  OrderReturnWithDetails,
  CreateReturnDto,
  UpdateReturnDto,
  ReturnQueryOptions,
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
  getArtisanOrders(
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

  // Status history (Json field)
  getOrderStatusHistory(orderId: string): Promise<any[]>;

  // Analytics
  getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats>;

  // Validation
  validateOrderAccess(orderId: string, userId: string, action?: string): Promise<boolean>;

  // Dispute methods
  createDispute(userId: string, data: CreateDisputeDto): Promise<OrderDisputeWithDetails>;
  updateDispute(
    id: string,
    data: UpdateDisputeDto,
    updatedBy: string,
  ): Promise<OrderDisputeWithDetails>;
  getMyDisputes(
    userId: string,
    options?: Partial<DisputeQueryOptions>,
  ): Promise<PaginatedResult<OrderDisputeWithDetails>>;
  getDisputeById(id: string): Promise<OrderDisputeWithDetails | null>;
  validateDisputeAccess(disputeId: string, userId: string): Promise<boolean>;

  // Return methods
  createReturn(userId: string, data: CreateReturnDto): Promise<OrderReturnWithDetails>;
  updateReturn(
    id: string,
    data: UpdateReturnDto,
    updatedBy: string,
  ): Promise<OrderReturnWithDetails>;
  getMyReturns(
    userId: string,
    options?: Partial<ReturnQueryOptions>,
  ): Promise<PaginatedResult<OrderReturnWithDetails>>;
  getReturnById(id: string): Promise<OrderReturnWithDetails | null>;
  validateReturnAccess(returnId: string, userId: string): Promise<boolean>;
}

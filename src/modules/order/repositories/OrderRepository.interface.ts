import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  PaymentTransaction,
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
import { OrderStatus, PaymentStatus } from '../models/OrderEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IOrderRepository extends BaseRepository<Order, string> {
  // Order creation
  createOrderFromCart(userId: string, data: CreateOrderFromCartDto): Promise<OrderWithDetails>;
  createOrderFromQuote(userId: string, data: CreateOrderFromQuoteDto): Promise<OrderWithDetails>;

  // Order retrieval
  findByIdWithDetails(id: string): Promise<OrderWithDetails | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null>;
  getOrders(options: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>>;
  getCustomerOrders(
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
    updatedBy?: string,
  ): Promise<OrderWithDetails>;
  cancelOrder(id: string, reason?: string, cancelledBy?: string): Promise<OrderWithDetails>;

  // Payment
  processPayment(id: string, data: ProcessPaymentDto): Promise<OrderWithDetails>;
  refundPayment(id: string, reason?: string): Promise<OrderWithDetails>;

  // Status history (Json field thay vì bảng riêng)
  addStatusToHistory(
    orderId: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
  ): Promise<void>;
  getStatusHistory(orderId: string): Promise<any[]>; // Return Json array

  // Utilities
  generateOrderNumber(): Promise<string>;
  getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats>;
  isUserInvolvedInOrder(orderId: string, userId: string): Promise<boolean>;

  // Dispute methods
  createDispute(
    data: CreateDisputeDto & { complainantId: string },
  ): Promise<OrderDisputeWithDetails>;
  updateDispute(
    id: string,
    data: UpdateDisputeDto,
    updatedBy?: string,
  ): Promise<OrderDisputeWithDetails>;
  getDisputes(options: DisputeQueryOptions): Promise<PaginatedResult<OrderDisputeWithDetails>>;
  getUserDisputes(
    userId: string,
    options?: Partial<DisputeQueryOptions>,
  ): Promise<PaginatedResult<OrderDisputeWithDetails>>;
  getDisputeById(id: string): Promise<OrderDisputeWithDetails | null>;

  // Return methods
  createReturn(data: CreateReturnDto & { requesterId: string }): Promise<OrderReturnWithDetails>;
  updateReturn(
    id: string,
    data: UpdateReturnDto,
    updatedBy?: string,
  ): Promise<OrderReturnWithDetails>;
  getReturns(options: ReturnQueryOptions): Promise<PaginatedResult<OrderReturnWithDetails>>;
  getUserReturns(
    userId: string,
    options?: Partial<ReturnQueryOptions>,
  ): Promise<PaginatedResult<OrderReturnWithDetails>>;
  getReturnById(id: string): Promise<OrderReturnWithDetails | null>;

  // Access control and validation methods
  canUserAccessDispute(disputeId: string, userId: string): Promise<boolean>;
  canUserAccessReturn(returnId: string, userId: string): Promise<boolean>;
  canUserCreateDispute(orderId: string, userId: string): Promise<boolean>;
  canUserCreateReturn(orderId: string, userId: string): Promise<boolean>;
}

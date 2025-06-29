import {
  CustomOrderRequest,
  CustomOrderWithDetails,
  CreateCustomOrderDto,
  ArtisanResponseDto,
  UpdateCustomOrderDto,
  CustomOrderQueryOptions,
  CustomOrderStats,
  CounterOfferDto,
  AcceptOfferDto,
  RejectOfferDto,
} from '../models/CustomOrder';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICustomOrderService {
  // Customer operations
  createCustomOrder(
    customerId: string,
    data: CreateCustomOrderDto,
  ): Promise<CustomOrderWithDetails>;
  updateCustomOrder(
    id: string,
    customerId: string,
    data: UpdateCustomOrderDto,
  ): Promise<CustomOrderWithDetails>;
  getMyCustomOrders(
    userId: string,
    role: string,
    options?: Partial<CustomOrderQueryOptions>,
  ): Promise<PaginatedResult<CustomOrderWithDetails>>;

  // Artisan operations
  respondToCustomOrder(
    id: string,
    artisanId: string,
    data: ArtisanResponseDto,
  ): Promise<CustomOrderWithDetails>;

  // Customer bidirectional operations (NEW)
  customerCounterOffer(
    id: string,
    customerId: string,
    data: CounterOfferDto,
  ): Promise<CustomOrderWithDetails>;
  customerAcceptOffer(
    id: string,
    customerId: string,
    data: AcceptOfferDto,
  ): Promise<CustomOrderWithDetails>;
  customerRejectOffer(
    id: string,
    customerId: string,
    data: RejectOfferDto,
  ): Promise<CustomOrderWithDetails>;

  // Common operations
  getCustomOrderById(id: string): Promise<CustomOrderWithDetails | null>;
  cancelCustomOrder(id: string, userId: string, reason?: string): Promise<CustomOrderWithDetails>;

  // Negotiation
  getNegotiationHistory(orderId: string): Promise<any[]>;
  addNegotiationEntry(orderId: string, entry: any): Promise<CustomOrderWithDetails>;

  // Validation & utilities
  validateOrderAccess(orderId: string, userId: string): Promise<boolean>;
  getOrderParticipants(orderId: string): Promise<{ customerId: string; artisanId: string } | null>;

  // Analytics
  getCustomOrderStats(userId?: string, role?: string): Promise<CustomOrderStats>;

  // Background tasks
  expireOldOrders(): Promise<number>;

  acceptCounterOffer(id: string, customerId: string): Promise<CustomOrderWithDetails>;
}

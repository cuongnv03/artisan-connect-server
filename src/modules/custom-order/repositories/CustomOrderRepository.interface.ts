import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  CustomOrderRequest,
  CustomOrderWithDetails,
  CreateCustomOrderDto,
  ArtisanResponseDto,
  UpdateCustomOrderDto,
  CustomOrderQueryOptions,
  CustomOrderStats,
} from '../models/CustomOrder';
import { QuoteStatus } from '../models/CustomOrderEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICustomOrderRepository extends BaseRepository<CustomOrderRequest, string> {
  // Core CRUD
  createCustomOrder(
    customerId: string,
    data: CreateCustomOrderDto,
  ): Promise<CustomOrderWithDetails>;

  updateCustomOrder(
    id: string,
    customerId: string,
    data: UpdateCustomOrderDto,
  ): Promise<CustomOrderWithDetails>;

  // Artisan response
  respondToCustomOrder(
    id: string,
    artisanId: string,
    data: ArtisanResponseDto,
  ): Promise<CustomOrderWithDetails>;

  // Retrieval
  findByIdWithDetails(id: string): Promise<CustomOrderWithDetails | null>;
  getCustomOrders(
    options: CustomOrderQueryOptions,
  ): Promise<PaginatedResult<CustomOrderWithDetails>>;
  getCustomerOrders(
    customerId: string,
    options?: Partial<CustomOrderQueryOptions>,
  ): Promise<PaginatedResult<CustomOrderWithDetails>>;
  getArtisanOrders(
    artisanId: string,
    options?: Partial<CustomOrderQueryOptions>,
  ): Promise<PaginatedResult<CustomOrderWithDetails>>;

  // Status management
  updateStatus(id: string, status: QuoteStatus): Promise<CustomOrderWithDetails>;
  expireOldRequests(): Promise<number>;

  // Negotiation
  addNegotiationEntry(id: string, entry: any): Promise<CustomOrderWithDetails>;
  getNegotiationHistory(id: string): Promise<any[]>;

  // Messaging
  getOrderMessages(quoteRequestId: string): Promise<any[]>;

  // Validation
  isUserInvolvedInOrder(orderId: string, userId: string): Promise<boolean>;
  canUserRespondToOrder(orderId: string, userId: string): Promise<boolean>;

  // Analytics
  getCustomOrderStats(userId?: string, role?: string): Promise<CustomOrderStats>;
}

import { ICustomOrderService } from './CustomOrderService.interface';
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
import { ICustomOrderRepository } from '../repositories/CustomOrderRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IMessageRepository } from '../../messaging/repositories/MessageRepository.interface';
import { INotificationService } from '../../notification/services/NotificationService.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class CustomOrderService implements ICustomOrderService {
  private customOrderRepository: ICustomOrderRepository;
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;
  private messageRepository: IMessageRepository;
  private notificationService: INotificationService;
  private logger = Logger.getInstance();

  constructor() {
    this.customOrderRepository = container.resolve<ICustomOrderRepository>('customOrderRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.messageRepository = container.resolve<IMessageRepository>('messageRepository');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  async createCustomOrder(
    customerId: string,
    data: CreateCustomOrderDto,
  ): Promise<CustomOrderWithDetails> {
    try {
      // Validate customer
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw AppError.notFound('Customer not found', 'CUSTOMER_NOT_FOUND');
      }

      // Validate artisan
      const artisan = await this.userRepository.findById(data.artisanId);
      if (!artisan || artisan.role !== 'ARTISAN') {
        throw AppError.notFound('Artisan not found', 'ARTISAN_NOT_FOUND');
      }

      // Validate reference product if provided
      if (data.referenceProductId) {
        const product = await this.productRepository.getProductById(data.referenceProductId);
        if (!product || product.seller.id !== data.artisanId) {
          throw AppError.notFound(
            'Reference product not found or not owned by artisan',
            'INVALID_PRODUCT',
          );
        }
      }

      // Validate data
      this.validateCreateCustomOrderData(data);

      const order = await this.customOrderRepository.createCustomOrder(customerId, data);

      // Send notification to artisan
      try {
        await this.notificationService.notifyCustomOrderRequest(
          customerId,
          data.artisanId,
          order.id,
        );
      } catch (notifError) {
        this.logger.error(`Error sending notification: ${notifError}`);
      }

      this.logger.info(`Custom order created: ${order.id} by customer ${customerId}`);

      return order;
    } catch (error) {
      this.logger.error(`Error creating custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create custom order', 'SERVICE_ERROR');
    }
  }

  async respondToCustomOrder(
    id: string,
    artisanId: string,
    data: ArtisanResponseDto,
  ): Promise<CustomOrderWithDetails> {
    try {
      // Validate artisan
      const artisan = await this.userRepository.findById(artisanId);
      if (!artisan || artisan.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans can respond to custom orders', 'FORBIDDEN');
      }

      // Validate response permission
      const canRespond = await this.customOrderRepository.canUserRespondToOrder(id, artisanId);
      if (!canRespond) {
        throw AppError.forbidden('Cannot respond to this order', 'CANNOT_RESPOND');
      }

      // Validate response data
      this.validateArtisanResponseData(data);

      const order = await this.customOrderRepository.respondToCustomOrder(id, artisanId, data);

      // Send notification to customer
      try {
        await this.notificationService.notifyCustomOrderResponse(
          id,
          order.customer.id,
          artisanId,
          data.action, // 'ACCEPT' | 'REJECT' | 'COUNTER_OFFER'
          data.finalPrice,
        );
      } catch (notifError) {
        this.logger.error(`Error sending notification: ${notifError}`);
      }

      this.logger.info(`Custom order response: ${id} - ${data.action} by artisan ${artisanId}`);

      return order;
    } catch (error) {
      this.logger.error(`Error responding to custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to respond to custom order', 'SERVICE_ERROR');
    }
  }

  async updateCustomOrder(
    id: string,
    customerId: string,
    data: UpdateCustomOrderDto,
  ): Promise<CustomOrderWithDetails> {
    try {
      // Validate customer
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw AppError.notFound('Customer not found', 'CUSTOMER_NOT_FOUND');
      }

      const order = await this.customOrderRepository.updateCustomOrder(id, customerId, data);

      this.logger.info(`Custom order updated: ${id} by customer ${customerId}`);

      return order;
    } catch (error) {
      this.logger.error(`Error updating custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update custom order', 'SERVICE_ERROR');
    }
  }

  async getCustomOrderById(id: string): Promise<CustomOrderWithDetails | null> {
    try {
      return await this.customOrderRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting custom order by ID: ${error}`);
      return null;
    }
  }

  async getMyCustomOrders(
    userId: string,
    role: string,
    options: Partial<CustomOrderQueryOptions> = {},
  ): Promise<PaginatedResult<CustomOrderWithDetails>> {
    try {
      if (role === 'CUSTOMER') {
        return await this.customOrderRepository.getCustomerOrders(userId, options);
      } else if (role === 'ARTISAN') {
        return await this.customOrderRepository.getArtisanOrders(userId, options);
      } else if (role === 'ADMIN') {
        return await this.customOrderRepository.getCustomOrders(options);
      } else {
        throw AppError.forbidden('Invalid role for custom orders', 'FORBIDDEN');
      }
    } catch (error) {
      this.logger.error(`Error getting my custom orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get custom orders', 'SERVICE_ERROR');
    }
  }

  async cancelCustomOrder(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<CustomOrderWithDetails> {
    try {
      // Get order to validate cancellation
      const order = await this.customOrderRepository.findByIdWithDetails(id);
      if (!order) {
        throw AppError.notFound('Custom order not found', 'ORDER_NOT_FOUND');
      }

      // Validate user can cancel
      if (order.customer.id !== userId && order.artisan.id !== userId) {
        throw AppError.forbidden('You can only cancel your own orders', 'FORBIDDEN');
      }

      // Only allow cancellation of certain statuses
      const cancellableStatuses = [QuoteStatus.PENDING, QuoteStatus.COUNTER_OFFERED];
      if (!cancellableStatuses.includes(order.status)) {
        throw AppError.badRequest(
          `Cannot cancel order in ${order.status} status`,
          'INVALID_STATUS_FOR_CANCELLATION',
        );
      }

      // Update to rejected status
      const cancelledOrder = await this.customOrderRepository.updateStatus(
        id,
        QuoteStatus.REJECTED,
      );

      this.logger.info(`Custom order cancelled: ${id} by user ${userId}`);

      return cancelledOrder;
    } catch (error) {
      this.logger.error(`Error cancelling custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to cancel custom order', 'SERVICE_ERROR');
    }
  }

  async getOrderParticipants(
    orderId: string,
  ): Promise<{ customerId: string; artisanId: string } | null> {
    try {
      const order = await this.customOrderRepository.findByIdWithDetails(orderId);
      if (!order) return null;

      return {
        customerId: order.customer.id,
        artisanId: order.artisan.id,
      };
    } catch (error) {
      this.logger.error(`Error getting order participants: ${error}`);
      return null;
    }
  }

  async addNegotiationEntry(orderId: string, entry: any): Promise<CustomOrderWithDetails> {
    try {
      return await this.customOrderRepository.addNegotiationEntry(orderId, entry);
    } catch (error) {
      this.logger.error(`Error adding negotiation entry: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to add negotiation entry', 'SERVICE_ERROR');
    }
  }

  async getNegotiationHistory(orderId: string): Promise<any[]> {
    try {
      return await this.customOrderRepository.getNegotiationHistory(orderId);
    } catch (error) {
      this.logger.error(`Error getting negotiation history: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get negotiation history', 'SERVICE_ERROR');
    }
  }

  async validateOrderAccess(orderId: string, userId: string): Promise<boolean> {
    try {
      // Get user role
      const user = await this.userRepository.findById(userId);
      if (!user) return false;

      // Admins can access everything
      if (user.role === 'ADMIN') return true;

      // Check if user is involved in the order
      return await this.customOrderRepository.isUserInvolvedInOrder(orderId, userId);
    } catch (error) {
      this.logger.error(`Error validating order access: ${error}`);
      return false;
    }
  }

  async getCustomOrderStats(userId?: string, role?: string): Promise<CustomOrderStats> {
    try {
      return await this.customOrderRepository.getCustomOrderStats(userId, role);
    } catch (error) {
      this.logger.error(`Error getting custom order stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get stats', 'SERVICE_ERROR');
    }
  }

  async expireOldOrders(): Promise<number> {
    try {
      const expiredCount = await this.customOrderRepository.expireOldRequests();

      if (expiredCount > 0) {
        this.logger.info(`Expired ${expiredCount} old custom orders`);
      }

      return expiredCount;
    } catch (error) {
      this.logger.error(`Error expiring old orders: ${error}`);
      return 0;
    }
  }

  async acceptCounterOffer(id: string, customerId: string): Promise<CustomOrderWithDetails> {
    try {
      // Get current order
      const order = await this.customOrderRepository.findByIdWithDetails(id);
      if (!order) {
        throw AppError.notFound('Custom order not found', 'ORDER_NOT_FOUND');
      }

      // Validate customer
      if (order.customer.id !== customerId) {
        throw AppError.forbidden('You can only accept your own orders', 'FORBIDDEN');
      }

      // Validate status
      if (order.status !== 'COUNTER_OFFERED') {
        throw AppError.badRequest('Only counter offers can be accepted', 'INVALID_STATUS');
      }

      // Check expiration
      if (order.expiresAt && order.expiresAt < new Date()) {
        throw AppError.badRequest('This custom order has expired', 'ORDER_EXPIRED');
      }

      // Update to accepted
      const acceptedOrder = await this.customOrderRepository.updateStatus(id, 'ACCEPTED');

      // Add to negotiation history
      await this.customOrderRepository.addNegotiationEntry(id, {
        action: 'ACCEPT_COUNTER',
        actor: 'customer',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Counter offer accepted by customer',
        },
      });

      // Send notification to artisan
      try {
        await this.notificationService.notifyCustomOrderCounterAccepted(
          id,
          customerId,
          order.artisan.id,
        );
      } catch (notifError) {
        this.logger.error(`Error sending notification: ${notifError}`);
      }

      this.logger.info(`Counter offer accepted: ${id} by customer ${customerId}`);

      return acceptedOrder;
    } catch (error) {
      this.logger.error(`Error accepting counter offer: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to accept counter offer', 'SERVICE_ERROR');
    }
  }

  // Private validation methods
  private validateCreateCustomOrderData(data: CreateCustomOrderDto): void {
    if (!data.title || data.title.trim().length < 5) {
      throw AppError.badRequest('Title must be at least 5 characters', 'INVALID_TITLE');
    }

    if (!data.description || data.description.trim().length < 10) {
      throw AppError.badRequest(
        'Description must be at least 10 characters',
        'INVALID_DESCRIPTION',
      );
    }

    if (data.estimatedPrice !== undefined && data.estimatedPrice <= 0) {
      throw AppError.badRequest('Estimated price must be greater than 0', 'INVALID_PRICE');
    }

    if (data.customerBudget !== undefined && data.customerBudget <= 0) {
      throw AppError.badRequest('Customer budget must be greater than 0', 'INVALID_BUDGET');
    }

    if (data.expiresInDays !== undefined) {
      if (data.expiresInDays < 1 || data.expiresInDays > 30) {
        throw AppError.badRequest('Expiration must be between 1 and 30 days', 'INVALID_EXPIRATION');
      }
    }
  }

  private validateArtisanResponseData(data: ArtisanResponseDto): void {
    if (data.action === 'COUNTER_OFFER') {
      if (!data.finalPrice || data.finalPrice <= 0) {
        throw AppError.badRequest(
          'Final price is required for counter offers and must be greater than 0',
          'INVALID_PRICE',
        );
      }
    }

    if (data.expiresInDays !== undefined) {
      if (data.expiresInDays < 1 || data.expiresInDays > 30) {
        throw AppError.badRequest('Expiration must be between 1 and 30 days', 'INVALID_EXPIRATION');
      }
    }
  }
}

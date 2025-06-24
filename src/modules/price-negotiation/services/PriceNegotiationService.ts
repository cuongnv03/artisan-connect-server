import { IPriceNegotiationService } from './PriceNegotiationService.interface';
import {
  PriceNegotiation,
  PriceNegotiationWithDetails,
  NegotiationSummary,
  CreateNegotiationDto,
  RespondToNegotiationDto,
  NegotiationQueryOptions,
  NegotiationStats,
} from '../models/PriceNegotiation';
import { NegotiationStatus } from '../models/PriceNegotiationEnums';
import { IPriceNegotiationRepository } from '../repositories/PriceNegotiationRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { INotificationService } from '../../notification/services/NotificationService.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class PriceNegotiationService implements IPriceNegotiationService {
  private negotiationRepository: IPriceNegotiationRepository;
  private productRepository: IProductRepository;
  private userRepository: IUserRepository;
  private notificationService: INotificationService;
  private logger = Logger.getInstance();

  constructor() {
    this.negotiationRepository = container.resolve<IPriceNegotiationRepository>(
      'priceNegotiationRepository',
    );
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  async createNegotiation(
    customerId: string,
    data: CreateNegotiationDto,
  ): Promise<PriceNegotiationWithDetails> {
    try {
      // Validate customer exists
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Validate product exists and get details
      const product = await this.productRepository.getProductById(data.productId);
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // NEW: Validate variant if provided
      if (data.variantId) {
        if (!product.hasVariants) {
          throw new AppError('This product does not have variants', 400, 'PRODUCT_NO_VARIANTS');
        }

        // Check if variant exists and belongs to the product
        const variant = await this.productRepository.getProductVariantById(data.variantId);
        if (!variant) {
          throw new AppError('Product variant not found', 404, 'VARIANT_NOT_FOUND');
        }

        // Verify variant belongs to the product
        const variantBelongsToProduct = await this.productRepository.isVariantBelongsToProduct(
          data.variantId,
          data.productId,
        );

        if (!variantBelongsToProduct) {
          throw new AppError(
            'Variant does not belong to this product',
            400,
            'VARIANT_PRODUCT_MISMATCH',
          );
        }

        if (!variant.isActive) {
          throw new AppError('Product variant is not active', 400, 'VARIANT_INACTIVE');
        }

        // Check variant quantity
        if (data.quantity && data.quantity > variant.quantity) {
          throw new AppError(
            `Requested quantity (${data.quantity}) exceeds available variant quantity (${variant.quantity})`,
            400,
            'INSUFFICIENT_VARIANT_QUANTITY',
          );
        }
      }

      // Additional business validations
      this.validateNegotiationData(data, product);

      // First check if existing negotiation exists (updated with variant)
      const existingCheck = await this.checkExistingNegotiation(
        customerId,
        data.productId,
        data.variantId, // NEW
      );

      if (existingCheck.hasActive && existingCheck.negotiation) {
        this.logger.info(
          `Returning existing negotiation for customer ${customerId}, product ${data.productId}${data.variantId ? `, variant ${data.variantId}` : ''}`,
        );

        return existingCheck.negotiation;
      }

      // Create new negotiation if no existing one
      const negotiation = await this.negotiationRepository.createNegotiation(customerId, data);

      // Send notification to artisan for NEW negotiations only
      setImmediate(async () => {
        try {
          const artisanId = product.sellerId || product.seller?.id;
          if (artisanId) {
            await this.notificationService.notifyPriceNegotiationRequest(
              data.productId,
              customerId,
              artisanId,
              data.proposedPrice,
            );
          }
        } catch (notifError) {
          this.logger.error(`Error sending negotiation notification: ${notifError}`);
          // Don't throw - just log the error
        }
      });

      this.logger.info(
        `New price negotiation created: ${negotiation.id} by customer ${customerId} for product ${data.productId}${data.variantId ? `, variant ${data.variantId}` : ''}`,
      );

      return negotiation;
    } catch (error) {
      this.logger.error(`Error creating price negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create price negotiation', 500, 'SERVICE_ERROR');
    }
  }

  async respondToNegotiation(
    negotiationId: string,
    artisanId: string,
    data: RespondToNegotiationDto,
  ): Promise<PriceNegotiationWithDetails> {
    try {
      // Validate artisan exists and has correct role
      const artisan = await this.userRepository.findById(artisanId);
      if (!artisan) {
        throw new AppError('Artisan not found', 404, 'ARTISAN_NOT_FOUND');
      }

      if (artisan.role !== 'ARTISAN') {
        throw new AppError('Only artisans can respond to price negotiations', 403, 'FORBIDDEN');
      }

      // Validate response permission
      const canRespond = await this.negotiationRepository.canUserRespondToNegotiation(
        negotiationId,
        artisanId,
      );
      if (!canRespond) {
        throw new AppError(
          'You cannot respond to this price negotiation',
          403,
          'CANNOT_RESPOND_TO_NEGOTIATION',
        );
      }

      // Validate response data
      this.validateNegotiationResponseData(data);

      const negotiation = await this.negotiationRepository.respondToNegotiation(
        negotiationId,
        artisanId,
        data,
      );

      // Send notification to customer
      try {
        await this.notificationService.notifyPriceNegotiationResponse(
          negotiation.product.id,
          negotiation.customer.id,
          artisanId,
          data.action,
          data.action === 'COUNTER' ? data.counterPrice : negotiation.finalPrice || undefined,
        );
      } catch (notifError) {
        this.logger.error(`Error sending negotiation response notification: ${notifError}`);
      }

      this.logger.info(
        `Price negotiation response: ${negotiationId} - ${data.action} by artisan ${artisanId}`,
      );

      return negotiation;
    } catch (error) {
      this.logger.error(`Error responding to price negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to price negotiation', 500, 'SERVICE_ERROR');
    }
  }

  async getNegotiationById(id: string): Promise<PriceNegotiationWithDetails | null> {
    try {
      return await this.negotiationRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting negotiation by ID: ${error}`);
      return null;
    }
  }

  async getNegotiations(
    options: NegotiationQueryOptions = {},
  ): Promise<PaginatedResult<NegotiationSummary>> {
    try {
      return await this.negotiationRepository.getNegotiations(options);
    } catch (error) {
      this.logger.error(`Error getting negotiations: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get negotiations', 500, 'SERVICE_ERROR');
    }
  }

  async getMyNegotiations(
    userId: string,
    userRole: string,
    options: Partial<NegotiationQueryOptions> = {},
  ): Promise<PaginatedResult<NegotiationSummary>> {
    try {
      if (userRole === 'CUSTOMER') {
        return await this.negotiationRepository.getCustomerNegotiations(userId, options);
      } else if (userRole === 'ARTISAN') {
        return await this.negotiationRepository.getArtisanNegotiations(userId, options);
      } else if (userRole === 'ADMIN') {
        return await this.negotiationRepository.getNegotiations(options);
      } else {
        throw new AppError('Invalid user role for price negotiations', 403, 'FORBIDDEN');
      }
    } catch (error) {
      this.logger.error(`Error getting my negotiations: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get my negotiations', 500, 'SERVICE_ERROR');
    }
  }

  async cancelNegotiation(
    negotiationId: string,
    userId: string,
    reason?: string,
  ): Promise<PriceNegotiationWithDetails> {
    try {
      // Get negotiation to validate cancellation
      const negotiation = await this.negotiationRepository.findByIdWithDetails(negotiationId);
      if (!negotiation) {
        throw new AppError('Price negotiation not found', 404, 'NEGOTIATION_NOT_FOUND');
      }

      // Validate user can cancel
      if (negotiation.customer.id !== userId && negotiation.artisan.id !== userId) {
        throw new AppError('You can only cancel your own price negotiations', 403, 'FORBIDDEN');
      }

      // Only allow cancellation of certain statuses
      const cancellableStatuses = [NegotiationStatus.PENDING, NegotiationStatus.COUNTER_OFFERED];
      if (!cancellableStatuses.includes(negotiation.status)) {
        throw new AppError(
          `Cannot cancel negotiation in ${negotiation.status} status`,
          400,
          'INVALID_STATUS_FOR_CANCELLATION',
        );
      }

      // Update to rejected status
      const cancelledNegotiation = await this.negotiationRepository.updateNegotiationStatus(
        negotiationId,
        NegotiationStatus.REJECTED,
      );

      this.logger.info(`Price negotiation cancelled: ${negotiationId} by user ${userId}`);

      return cancelledNegotiation;
    } catch (error) {
      this.logger.error(`Error cancelling price negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel price negotiation', 500, 'SERVICE_ERROR');
    }
  }

  async checkExistingNegotiation(
    customerId: string,
    productId: string,
    variantId?: string, // NEW
  ): Promise<{
    hasActive: boolean;
    negotiation?: PriceNegotiationWithDetails;
  }> {
    try {
      // Validate customer exists
      const customer = await this.userRepository.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Get existing negotiation (updated with variant support)
      const negotiation = await this.negotiationRepository.checkExistingNegotiation(
        customerId,
        productId,
        variantId, // NEW
      );

      if (negotiation) {
        this.logger.info(
          `Found existing negotiation ${negotiation.id} for customer ${customerId}, product ${productId}${variantId ? `, variant ${variantId}` : ''}`,
        );

        return {
          hasActive: true,
          negotiation,
        };
      }

      return { hasActive: false };
    } catch (error) {
      this.logger.error(`Error checking existing negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to check existing negotiation', 500, 'SERVICE_ERROR');
    }
  }

  async validateNegotiationAccess(
    negotiationId: string,
    userId: string,
    action: string = 'VIEW',
  ): Promise<boolean> {
    try {
      // Get user role
      const user = await this.userRepository.findById(userId);
      if (!user) {
        this.logger.warn(`User not found for access validation: ${userId}`);
        return false;
      }

      // Admins can access everything
      if (user.role === 'ADMIN') {
        this.logger.info(`Admin access granted for negotiation ${negotiationId}`);
        return true;
      }

      // Check if user is involved in the negotiation
      const isInvolved = await this.negotiationRepository.isUserInvolvedInNegotiation(
        negotiationId,
        userId,
      );

      if (!isInvolved) {
        this.logger.warn(`User ${userId} not involved in negotiation ${negotiationId}`);
        return false;
      }

      this.logger.info(`Access granted for user ${userId} to negotiation ${negotiationId}`);

      // Additional permission checks based on action
      if (action === 'RESPOND') {
        return await this.negotiationRepository.canUserRespondToNegotiation(negotiationId, userId);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating negotiation access: ${error}`);
      return false;
    }
  }

  async getNegotiationStats(userId?: string, userRole?: string): Promise<NegotiationStats> {
    try {
      return await this.negotiationRepository.getNegotiationStats(userId, userRole);
    } catch (error) {
      this.logger.error(`Error getting negotiation stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get negotiation stats', 500, 'SERVICE_ERROR');
    }
  }

  async expireOldNegotiations(): Promise<number> {
    try {
      const expiredCount = await this.negotiationRepository.expireNegotiations();

      if (expiredCount > 0) {
        this.logger.info(`Expired ${expiredCount} old price negotiations`);
      }

      return expiredCount;
    } catch (error) {
      this.logger.error(`Error expiring old negotiations: ${error}`);
      return 0;
    }
  }

  // Private validation methods
  private validateNegotiationData(data: CreateNegotiationDto, product: any): void {
    // Validate proposed price
    if (data.proposedPrice <= 0) {
      throw new AppError('Proposed price must be greater than 0', 400, 'INVALID_PROPOSED_PRICE');
    }

    // Get the correct price to compare against (variant price or product price)
    let originalPrice = Number(product.discountPrice || product.price);

    // NEW: If variant is specified, use variant price
    if (data.variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v: any) => v.id === data.variantId);
      if (variant) {
        originalPrice = Number(variant.discountPrice || variant.price);
      }
    }

    // Check if proposed price is reasonable (not too low compared to original price)
    const minAcceptablePrice = originalPrice * 0.3; // At least 30% of original price

    if (data.proposedPrice < minAcceptablePrice) {
      throw new AppError(
        `Proposed price is too low. Minimum acceptable price is ${minAcceptablePrice.toFixed(2)}`,
        400,
        'PROPOSED_PRICE_TOO_LOW',
      );
    }

    // Don't allow proposed price higher than original
    if (data.proposedPrice > originalPrice) {
      throw new AppError(
        'Proposed price cannot be higher than the original price',
        400,
        'PROPOSED_PRICE_TOO_HIGH',
      );
    }

    // Validate quantity
    if (data.quantity && data.quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
    }

    // Check product/variant quantity
    if (data.quantity) {
      if (data.variantId) {
        // Check variant quantity
        const variant = product.variants?.find((v: any) => v.id === data.variantId);
        if (variant && data.quantity > variant.quantity) {
          throw new AppError(
            `Quantity must not exceed available variant stock (${variant.quantity})`,
            400,
            'INVALID_QUANTITY',
          );
        }
      } else {
        // Check product quantity
        if (data.quantity > product.quantity) {
          throw new AppError(
            `Quantity must not exceed available stock (${product.quantity})`,
            400,
            'INVALID_QUANTITY',
          );
        }
      }
    }

    // Validate reason
    if (data.customerReason && data.customerReason.length > 1000) {
      throw new AppError('Customer reason cannot exceed 1000 characters', 400, 'REASON_TOO_LONG');
    }

    // Validate expiration
    if (data.expiresInDays !== undefined) {
      if (data.expiresInDays < 1 || data.expiresInDays > 7) {
        throw new AppError('Expiration must be between 1 and 7 days', 400, 'INVALID_EXPIRATION');
      }
    }
  }

  private validateNegotiationResponseData(data: RespondToNegotiationDto): void {
    // Validate counter price if action is COUNTER
    if (data.action === 'COUNTER') {
      if (!data.counterPrice || data.counterPrice <= 0) {
        throw new AppError(
          'Counter price is required and must be greater than 0',
          400,
          'INVALID_COUNTER_PRICE',
        );
      }
    }

    // Validate response length
    if (data.artisanResponse && data.artisanResponse.length > 1000) {
      throw new AppError(
        'Response message cannot exceed 1000 characters',
        400,
        'RESPONSE_TOO_LONG',
      );
    }

    // Ensure counter price is not provided for non-counter actions
    if (data.action !== 'COUNTER' && data.counterPrice !== undefined) {
      throw new AppError(
        'Counter price should only be provided when action is COUNTER',
        400,
        'UNNECESSARY_COUNTER_PRICE',
      );
    }
  }
}

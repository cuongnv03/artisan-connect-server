import { IQuoteService } from './QuoteService.interface';
import {
  QuoteRequest,
  QuoteRequestWithDetails,
  QuoteSummary,
  QuoteNegotiation,
  CreateQuoteRequestDto,
  RespondToQuoteDto,
  AddQuoteMessageDto,
  QuoteQueryOptions,
  QuoteStats,
} from '../models/Quote';
import { QuoteStatus, QuoteAction } from '../models/QuoteEnums';
import { IQuoteRepository } from '../repositories/QuoteRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class QuoteService implements IQuoteService {
  private quoteRepository: IQuoteRepository;
  private productRepository: IProductRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.quoteRepository = container.resolve<IQuoteRepository>('quoteRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  async createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails> {
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

      // Additional business validations
      this.validateQuoteRequestData(data, product);

      const quote = await this.quoteRepository.createQuoteRequest(customerId, data);

      this.logger.info(
        `Quote request created: ${quote.id} by customer ${customerId} for product ${data.productId}`,
      );

      return quote;
    } catch (error) {
      this.logger.error(`Error creating quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create quote request', 500, 'SERVICE_ERROR');
    }
  }

  async respondToQuote(
    quoteId: string,
    artisanId: string,
    data: RespondToQuoteDto,
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Validate artisan exists and has correct role
      const artisan = await this.userRepository.findById(artisanId);
      if (!artisan) {
        throw new AppError('Artisan not found', 404, 'ARTISAN_NOT_FOUND');
      }

      if (artisan.role !== 'ARTISAN') {
        throw new AppError('Only artisans can respond to quote requests', 403, 'FORBIDDEN');
      }

      // Validate response permission
      const canRespond = await this.quoteRepository.canUserRespondToQuote(quoteId, artisanId);
      if (!canRespond) {
        throw new AppError(
          'You cannot respond to this quote request',
          403,
          'CANNOT_RESPOND_TO_QUOTE',
        );
      }

      // Validate response data
      this.validateQuoteResponseData(data);

      const quote = await this.quoteRepository.respondToQuote(quoteId, artisanId, data);

      this.logger.info(`Quote response: ${quoteId} - ${data.action} by artisan ${artisanId}`);

      return quote;
    } catch (error) {
      this.logger.error(`Error responding to quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to quote request', 500, 'SERVICE_ERROR');
    }
  }

  async getQuoteById(id: string): Promise<QuoteRequestWithDetails | null> {
    try {
      return await this.quoteRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting quote by ID: ${error}`);
      return null;
    }
  }

  async getQuotes(options: QuoteQueryOptions = {}): Promise<PaginatedResult<QuoteSummary>> {
    try {
      return await this.quoteRepository.getQuotes(options);
    } catch (error) {
      this.logger.error(`Error getting quotes: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get quotes', 500, 'SERVICE_ERROR');
    }
  }

  async getMyQuoteRequests(
    userId: string,
    userRole: string,
    options: Partial<QuoteQueryOptions> = {},
  ): Promise<PaginatedResult<QuoteSummary>> {
    try {
      if (userRole === 'CUSTOMER') {
        return await this.quoteRepository.getCustomerQuotes(userId, options);
      } else if (userRole === 'ARTISAN') {
        return await this.quoteRepository.getArtisanQuotes(userId, options);
      } else if (userRole === 'ADMIN') {
        return await this.quoteRepository.getQuotes(options);
      } else {
        throw new AppError('Invalid user role for quote requests', 403, 'FORBIDDEN');
      }
    } catch (error) {
      this.logger.error(`Error getting my quote requests: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get my quote requests', 500, 'SERVICE_ERROR');
    }
  }

  async addMessageToQuote(
    quoteId: string,
    userId: string,
    message: string,
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Validate user access
      const hasAccess = await this.validateQuoteAccess(quoteId, userId, 'MESSAGE');
      if (!hasAccess) {
        throw new AppError(
          'You do not have permission to add messages to this quote',
          403,
          'FORBIDDEN',
        );
      }

      // Get quote to determine if user is customer or artisan
      const quote = await this.quoteRepository.findByIdWithDetails(quoteId);
      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      const isCustomerMessage = quote.customer.id === userId;

      const updatedQuote = await this.quoteRepository.addMessage(quoteId, {
        message: message.trim(),
        isCustomerMessage,
      });

      this.logger.info(
        `Message added to quote ${quoteId} by ${isCustomerMessage ? 'customer' : 'artisan'} ${userId}`,
      );

      return updatedQuote;
    } catch (error) {
      this.logger.error(`Error adding message to quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add message to quote', 500, 'SERVICE_ERROR');
    }
  }

  async getNegotiationHistory(quoteId: string): Promise<QuoteNegotiation[]> {
    try {
      return await this.quoteRepository.getNegotiationHistory(quoteId);
    } catch (error) {
      this.logger.error(`Error getting negotiation history: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get negotiation history', 500, 'SERVICE_ERROR');
    }
  }

  async cancelQuoteRequest(
    quoteId: string,
    userId: string,
    reason?: string,
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Get quote to validate cancellation
      const quote = await this.quoteRepository.findByIdWithDetails(quoteId);
      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Validate user can cancel
      if (quote.customer.id !== userId && quote.artisan.id !== userId) {
        throw new AppError('You can only cancel your own quote requests', 403, 'FORBIDDEN');
      }

      // Only allow cancellation of certain statuses
      const cancellableStatuses = [QuoteStatus.PENDING, QuoteStatus.COUNTER_OFFERED];
      if (!cancellableStatuses.includes(quote.status)) {
        throw new AppError(
          `Cannot cancel quote in ${quote.status} status`,
          400,
          'INVALID_STATUS_FOR_CANCELLATION',
        );
      }

      // Update to rejected status
      const cancelledQuote = await this.quoteRepository.updateQuoteStatus(
        quoteId,
        QuoteStatus.REJECTED,
      );

      // Add message if reason provided
      if (reason) {
        const isCustomerMessage = quote.customer.id === userId;
        await this.quoteRepository.addMessage(quoteId, {
          message: `Quote cancelled: ${reason}`,
          isCustomerMessage,
        });
      }

      this.logger.info(`Quote cancelled: ${quoteId} by user ${userId}`);

      return cancelledQuote;
    } catch (error) {
      this.logger.error(`Error cancelling quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel quote request', 500, 'SERVICE_ERROR');
    }
  }

  async validateQuoteAccess(
    quoteId: string,
    userId: string,
    action: string = 'VIEW',
  ): Promise<boolean> {
    try {
      // Get user role
      const user = await this.userRepository.findById(userId);
      if (!user) return false;

      // Admins can access everything
      if (user.role === 'ADMIN') return true;

      // Check if user is involved in the quote
      const isInvolved = await this.quoteRepository.isUserInvolvedInQuote(quoteId, userId);
      if (!isInvolved) return false;

      // Additional permission checks based on action
      if (action === 'RESPOND') {
        return await this.quoteRepository.canUserRespondToQuote(quoteId, userId);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating quote access: ${error}`);
      return false;
    }
  }

  async getQuoteStats(userId?: string, userRole?: string): Promise<QuoteStats> {
    try {
      return await this.quoteRepository.getQuoteStats(userId, userRole);
    } catch (error) {
      this.logger.error(`Error getting quote stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get quote stats', 500, 'SERVICE_ERROR');
    }
  }

  async expireOldQuotes(): Promise<number> {
    try {
      const expiredCount = await this.quoteRepository.expireQuotes();

      if (expiredCount > 0) {
        this.logger.info(`Expired ${expiredCount} old quote requests`);
      }

      return expiredCount;
    } catch (error) {
      this.logger.error(`Error expiring old quotes: ${error}`);
      return 0;
    }
  }

  // Private validation methods
  private validateQuoteRequestData(data: CreateQuoteRequestDto, product: any): void {
    // Validate requested price if provided
    if (data.requestedPrice !== undefined) {
      if (data.requestedPrice <= 0) {
        throw new AppError(
          'Requested price must be greater than 0',
          400,
          'INVALID_REQUESTED_PRICE',
        );
      }

      // Check if requested price is reasonable (not too low compared to original price)
      const originalPrice = product.discountPrice || product.price;
      const minAcceptablePrice = originalPrice * 0.5; // At least 50% of original price

      if (data.requestedPrice < minAcceptablePrice) {
        throw new AppError(
          `Requested price is too low. Minimum acceptable price is $${minAcceptablePrice.toFixed(2)}`,
          400,
          'REQUESTED_PRICE_TOO_LOW',
        );
      }
    }

    // Validate specifications
    if (data.specifications && data.specifications.length > 2000) {
      throw new AppError(
        'Specifications cannot exceed 2000 characters',
        400,
        'SPECIFICATIONS_TOO_LONG',
      );
    }

    // Validate expiration
    if (data.expiresInDays !== undefined) {
      if (data.expiresInDays < 1 || data.expiresInDays > 30) {
        throw new AppError('Expiration must be between 1 and 30 days', 400, 'INVALID_EXPIRATION');
      }
    }

    // Validate message
    if (data.message && data.message.length > 1000) {
      throw new AppError('Message cannot exceed 1000 characters', 400, 'MESSAGE_TOO_LONG');
    }
  }

  private validateQuoteResponseData(data: RespondToQuoteDto): void {
    // Validate counter offer if action is COUNTER
    if (data.action === QuoteAction.COUNTER) {
      if (!data.counterOffer || data.counterOffer <= 0) {
        throw new AppError(
          'Counter offer amount is required and must be greater than 0',
          400,
          'INVALID_COUNTER_OFFER',
        );
      }
    }

    // Validate message length
    if (data.message && data.message.length > 1000) {
      throw new AppError('Response message cannot exceed 1000 characters', 400, 'MESSAGE_TOO_LONG');
    }

    // Ensure counter offer is not provided for non-counter actions
    if (data.action !== QuoteAction.COUNTER && data.counterOffer !== undefined) {
      throw new AppError(
        'Counter offer should only be provided when action is COUNTER',
        400,
        'UNNECESSARY_COUNTER_OFFER',
      );
    }
  }
}

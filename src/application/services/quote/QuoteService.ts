import { IQuoteService } from './QuoteService.interface';
import {
  QuoteRequest,
  QuoteRequestWithDetails,
  CreateQuoteRequestDto,
  RespondToQuoteDto,
  AddQuoteMessageDto,
  QuoteRequestQueryOptions,
} from '../../../domain/quote/entities/QuoteRequest';
import { QuoteMessage } from '../../../domain/quote/entities/QuoteMessage';
import { QuoteStatus } from '../../../domain/quote/valueObjects/QuoteEnums';
import { IQuoteRepository } from '../../../domain/quote/repositories/QuoteRepository.interface';
import { IProductRepository } from '../../../domain/product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../../domain/user/repositories/UserRepository.interface';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';
import container from '../../../di/container';

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

  /**
   * Create a new quote request
   */
  async createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(customerId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate product exists and is customizable
      const product = await this.productRepository.findByIdWithDetails(data.productId);
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (!product.isCustomizable) {
        throw new AppError(
          'Quote requests are only available for customizable products',
          400,
          'PRODUCT_NOT_CUSTOMIZABLE',
        );
      }

      // Create quote request
      return await this.quoteRepository.createQuoteRequest(customerId, data);
    } catch (error) {
      this.logger.error(`Error creating quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create quote request', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get quote request by ID
   */
  async getQuoteRequestById(id: string): Promise<QuoteRequestWithDetails | null> {
    try {
      return await this.quoteRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting quote request: ${error}`);
      return null;
    }
  }

  /**
   * Get quote requests with filtering
   */
  async getQuoteRequests(
    options: QuoteRequestQueryOptions,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>> {
    try {
      return await this.quoteRepository.getQuoteRequests(options);
    } catch (error) {
      this.logger.error(`Error getting quote requests: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get quote requests', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get customer quote requests
   */
  async getCustomerQuoteRequests(
    customerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>> {
    try {
      return await this.quoteRepository.getQuoteRequests({
        customerId,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error(`Error getting customer quote requests: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get customer quote requests', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get artisan quote requests
   */
  async getArtisanQuoteRequests(
    artisanId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>> {
    try {
      return await this.quoteRepository.getQuoteRequests({
        artisanId,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error(`Error getting artisan quote requests: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get artisan quote requests', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Respond to quote request
   */
  async respondToQuoteRequest(
    quoteId: string,
    artisanId: string,
    response: RespondToQuoteDto,
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Get quote with details
      const quote = await this.quoteRepository.findByIdWithDetails(quoteId);

      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Verify the user is the artisan for this quote
      if (quote.artisanId !== artisanId) {
        throw new AppError('Only the artisan can respond to this quote', 403, 'FORBIDDEN');
      }

      // Verify quote is in PENDING or COUNTER_OFFERED status (if customer counter-offered)
      if (
        quote.status !== QuoteStatus.PENDING &&
        !(quote.status === QuoteStatus.COUNTER_OFFERED && quote.counterOffer)
      ) {
        throw new AppError(
          'This quote cannot be responded to in its current state',
          400,
          'INVALID_QUOTE_STATE',
        );
      }

      // Process response based on action
      let updateData: any = {};
      let newStatus: QuoteStatus;

      switch (response.action) {
        case 'accept':
          newStatus = QuoteStatus.ACCEPTED;

          // If there was already a counter offer, use that as final price
          if (quote.counterOffer) {
            updateData.finalPrice = quote.counterOffer;
          }
          // Otherwise use customer's requested price
          else if (quote.requestedPrice) {
            updateData.finalPrice = quote.requestedPrice;
          } else {
            throw new AppError(
              'No price has been specified for this quote',
              400,
              'NO_PRICE_SPECIFIED',
            );
          }
          break;

        case 'reject':
          newStatus = QuoteStatus.REJECTED;
          break;

        case 'counter':
          if (!response.counterOffer) {
            throw new AppError('Counter offer amount is required', 400, 'MISSING_COUNTER_OFFER');
          }
          newStatus = QuoteStatus.COUNTER_OFFERED;
          updateData.counterOffer = response.counterOffer;
          break;

        default:
          throw new AppError('Invalid action', 400, 'INVALID_ACTION');
      }

      // Update quote status
      const updatedQuote = await this.quoteRepository.updateQuoteStatus(
        quoteId,
        newStatus,
        updateData,
      );

      // Add response message if provided
      if (response.message) {
        await this.quoteRepository.addMessageToQuote(quoteId, artisanId, response.message);
      }

      return updatedQuote;
    } catch (error) {
      this.logger.error(`Error responding to quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to quote request', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Add message to quote
   */
  async addMessageToQuote(
    quoteId: string,
    userId: string,
    data: AddQuoteMessageDto,
  ): Promise<QuoteMessage> {
    try {
      // Verify user is involved in the quote
      const isInvolved = await this.quoteRepository.isUserInvolved(quoteId, userId);

      if (!isInvolved) {
        throw new AppError(
          'You are not authorized to send messages to this quote',
          403,
          'FORBIDDEN',
        );
      }

      return await this.quoteRepository.addMessageToQuote(quoteId, userId, data.message);
    } catch (error) {
      this.logger.error(`Error adding message to quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add message to quote', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Cancel quote request
   */
  async cancelQuoteRequest(quoteId: string, userId: string): Promise<QuoteRequestWithDetails> {
    try {
      // Get quote
      const quote = await this.quoteRepository.findByIdWithDetails(quoteId);

      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Verify the user is involved in this quote
      if (quote.customerId !== userId && quote.artisanId !== userId) {
        throw new AppError('You are not authorized to cancel this quote', 403, 'FORBIDDEN');
      }

      // Only allow cancellation of PENDING or COUNTER_OFFERED quotes
      if (quote.status !== QuoteStatus.PENDING && quote.status !== QuoteStatus.COUNTER_OFFERED) {
        throw new AppError(
          'This quote cannot be cancelled in its current state',
          400,
          'INVALID_QUOTE_STATE',
        );
      }

      // Update quote to REJECTED status
      return await this.quoteRepository.updateQuoteStatus(quoteId, QuoteStatus.REJECTED);
    } catch (error) {
      this.logger.error(`Error cancelling quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel quote request', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Clean up expired quotes
   */
  async cleanupExpiredQuotes(): Promise<number> {
    try {
      return await this.quoteRepository.markExpiredQuotes();
    } catch (error) {
      this.logger.error(`Error cleaning up expired quotes: ${error}`);
      return 0;
    }
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(quoteId: string, status: QuoteStatus): Promise<QuoteRequestWithDetails> {
    try {
      // Get quote with details
      const quote = await this.quoteRepository.findByIdWithDetails(quoteId);

      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Update quote to the new status
      return await this.quoteRepository.updateQuoteStatus(quoteId, status);
    } catch (error) {
      this.logger.error(`Error updating quote status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update quote status', 500, 'SERVICE_ERROR');
    }
  }
}

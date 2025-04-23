import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { BasePrismaRepository } from './BasePrismaRepository';
import { IQuoteRepository } from '../../../domain/quote/repositories/QuoteRepository.interface';
import {
  QuoteRequest,
  QuoteRequestWithDetails,
  CreateQuoteRequestDto,
  QuoteRequestQueryOptions,
} from '../../../domain/quote/entities/QuoteRequest';
import { QuoteMessage } from '../../../domain/quote/entities/QuoteMessage';
import { QuoteStatus } from '../../../domain/quote/valueObjects/QuoteEnums';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';

export class QuoteRepository
  extends BasePrismaRepository<QuoteRequest, string>
  implements IQuoteRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'quoteRequest');
  }

  /**
   * Find quote request by ID with details
   */
  async findByIdWithDetails(id: string): Promise<QuoteRequestWithDetails | null> {
    try {
      const quote = await this.prisma.quoteRequest.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
              isCustomizable: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          artisan: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
      });

      if (!quote) return null;

      // Transform the data to match our domain entity
      return {
        ...quote,
        messages: (quote.messages as any) || [],
      } as unknown as QuoteRequestWithDetails;
    } catch (error) {
      this.logger.error(`Error finding quote request: ${error}`);
      return null;
    }
  }

  /**
   * Create a new quote request
   */
  async createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Get product to verify it exists and get artisan ID
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
        select: {
          id: true,
          sellerId: true,
          isCustomizable: true,
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Only allow quote requests for customizable products
      if (!product.isCustomizable) {
        throw new AppError(
          'Quote requests are only available for customizable products',
          400,
          'PRODUCT_NOT_CUSTOMIZABLE',
        );
      }

      // Check if artisan and customer are different people
      if (product.sellerId === customerId) {
        throw new AppError(
          'You cannot create a quote request for your own product',
          400,
          'INVALID_QUOTE_REQUEST',
        );
      }

      // Calculate expiration date if provided
      let expiresAt = null;
      if (data.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
      } else {
        // Default 7 days expiration
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
      }

      // Prepare initial message if specifications are provided
      const initialMessages = data.specifications
        ? [
            {
              id: uuidv4(),
              senderId: customerId,
              message: data.specifications,
              createdAt: new Date(),
            },
          ]
        : [];

      // Create quote request
      const quote = await this.prisma.quoteRequest.create({
        data: {
          productId: data.productId,
          customerId,
          artisanId: product.sellerId,
          requestedPrice: data.requestedPrice || null,
          specifications: data.specifications || null,
          status: QuoteStatus.PENDING,
          messages: initialMessages,
          expiresAt,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
              isCustomizable: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          artisan: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
      });

      return quote as unknown as QuoteRequestWithDetails;
    } catch (error) {
      this.logger.error(`Error creating quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create quote request', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get quote requests with filtering and pagination
   */
  async getQuoteRequests(
    options: QuoteRequestQueryOptions,
  ): Promise<PaginatedResult<QuoteRequestWithDetails>> {
    try {
      const { status, customerId, artisanId, productId, page = 1, limit = 10 } = options;

      // Build where conditions
      const where: any = {};

      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (artisanId) {
        where.artisanId = artisanId;
      }

      if (productId) {
        where.productId = productId;
      }

      // Count total matching quotes
      const total = await this.prisma.quoteRequest.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get quotes with pagination
      const quotes = await this.prisma.quoteRequest.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
              isCustomizable: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          artisan: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Transform data to match expected format
      const transformedQuotes = quotes.map((quote) => ({
        ...quote,
        messages: (quote.messages as any) || [],
      }));

      return {
        data: transformedQuotes as unknown as QuoteRequestWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting quote requests: ${error}`);
      throw new AppError('Failed to get quote requests', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update quote request status
   */
  async updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    data?: { counterOffer?: number; finalPrice?: number },
  ): Promise<QuoteRequestWithDetails> {
    try {
      // Check if quote exists
      const existingQuote = await this.prisma.quoteRequest.findUnique({
        where: { id },
      });

      if (!existingQuote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Update quote status and additional data
      const updateData: any = { status };

      if (data) {
        if (data.counterOffer !== undefined) {
          updateData.counterOffer = data.counterOffer;
        }

        if (data.finalPrice !== undefined) {
          updateData.finalPrice = data.finalPrice;
        }
      }

      // When accepting, set final price to requested price if no counter offer
      if (status === QuoteStatus.ACCEPTED && !existingQuote.counterOffer) {
        updateData.finalPrice = existingQuote.requestedPrice;
      }

      // Update quote
      const updatedQuote = await this.prisma.quoteRequest.update({
        where: { id },
        data: updateData,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
              isCustomizable: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          artisan: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
      });

      return {
        ...updatedQuote,
        messages: (updatedQuote.messages as any) || [],
      } as unknown as QuoteRequestWithDetails;
    } catch (error) {
      this.logger.error(`Error updating quote status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update quote status', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Add message to quote
   */
  async addMessageToQuote(quoteId: string, userId: string, message: string): Promise<QuoteMessage> {
    try {
      // Check if quote exists
      const quote = await this.prisma.quoteRequest.findUnique({
        where: { id: quoteId },
      });

      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Check if user is involved in this quote
      if (quote.customerId !== userId && quote.artisanId !== userId) {
        throw new AppError(
          'You are not authorized to add messages to this quote',
          403,
          'FORBIDDEN',
        );
      }

      // Create new message
      const newMessage: QuoteMessage = {
        id: uuidv4(),
        senderId: userId,
        message,
        createdAt: new Date(),
      };

      // Get existing messages
      const currentMessages = (quote.messages as any) || [];

      // Add new message to the list
      const updatedMessages = [...currentMessages, newMessage];

      // Update quote with new message
      await this.prisma.quoteRequest.update({
        where: { id: quoteId },
        data: {
          messages: updatedMessages,
          updatedAt: new Date(), // Ensure updatedAt is refreshed
        },
      });

      return newMessage;
    } catch (error) {
      this.logger.error(`Error adding message to quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add message to quote', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Check if user is involved in quote
   */
  async isUserInvolved(quoteId: string, userId: string): Promise<boolean> {
    try {
      const quote = await this.prisma.quoteRequest.findUnique({
        where: { id: quoteId },
        select: { customerId: true, artisanId: true },
      });

      if (!quote) return false;

      return quote.customerId === userId || quote.artisanId === userId;
    } catch (error) {
      this.logger.error(`Error checking if user is involved in quote: ${error}`);
      return false;
    }
  }

  /**
   * Mark quote request as expired
   */
  async markExpiredQuotes(): Promise<number> {
    try {
      const result = await this.prisma.quoteRequest.updateMany({
        where: {
          status: QuoteStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: QuoteStatus.EXPIRED,
        },
      });

      return result.count;
    } catch (error) {
      this.logger.error(`Error marking expired quotes: ${error}`);
      return 0;
    }
  }

  /**
   * Delete a quote request
   */
  async deleteQuoteRequest(id: string): Promise<boolean> {
    try {
      await this.prisma.quoteRequest.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting quote request: ${error}`);
      return false;
    }
  }
}

import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IQuoteRepository } from './QuoteRepository.interface';
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
import {
  CreateNegotiationEntryDto,
  QuoteNegotiationHistory,
} from '../models/QuoteNegotiationHistory';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class QuoteRepository
  extends BasePrismaRepository<QuoteRequest, string>
  implements IQuoteRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'quoteRequest');
  }

  async createQuoteRequest(
    customerId: string,
    data: CreateQuoteRequestDto,
  ): Promise<QuoteRequestWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate product exists and is customizable
        const product = await tx.product.findUnique({
          where: { id: data.productId },
          include: {
            seller: {
              include: {
                artisanProfile: {
                  select: { shopName: true, isVerified: true, rating: true },
                },
              },
            },
          },
        });

        if (!product) {
          throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
        }

        if (product.status !== 'PUBLISHED') {
          throw new AppError('Product is not available for quotes', 400, 'PRODUCT_NOT_AVAILABLE');
        }

        if (!product.isCustomizable) {
          throw new AppError(
            'This product does not accept custom quote requests',
            400,
            'PRODUCT_NOT_CUSTOMIZABLE',
          );
        }

        if (product.sellerId === customerId) {
          throw new AppError(
            'You cannot create a quote request for your own product',
            400,
            'CANNOT_QUOTE_OWN_PRODUCT',
          );
        }

        // Check for existing active quotes
        const existingQuote = await tx.quoteRequest.findFirst({
          where: {
            productId: data.productId,
            customerId,
            status: { in: ['PENDING', 'COUNTER_OFFERED'] },
          },
        });

        if (existingQuote) {
          throw new AppError(
            'You already have an active quote request for this product',
            400,
            'DUPLICATE_QUOTE_REQUEST',
          );
        }

        // Calculate expiration date
        const expiresAt = data.expiresInDays
          ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

        // Create quote request
        const quote = await tx.quoteRequest.create({
          data: {
            productId: data.productId,
            customerId,
            artisanId: product.sellerId,
            requestedPrice: data.requestedPrice,
            specifications: data.specifications,
            customerMessage: data.message,
            status: QuoteStatus.PENDING,
            expiresAt,
          },
        });

        // Add initial negotiation entry
        await this.createNegotiationEntry(quote.id, {
          action: QuoteAction.REQUEST,
          actor: 'customer',
          newPrice: data.requestedPrice,
          message: data.message,
          metadata: {
            specifications: data.specifications,
            expiresAt: expiresAt.toISOString(),
          },
        });

        return (await this.findByIdWithDetails(quote.id)) as QuoteRequestWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error creating quote request: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create quote request', 500, 'QUOTE_CREATION_FAILED');
    }
  }

  async respondToQuote(
    id: string,
    artisanId: string,
    data: RespondToQuoteDto,
  ): Promise<QuoteRequestWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get current quote
        const quote = await tx.quoteRequest.findUnique({
          where: { id },
          include: { product: true },
        });

        if (!quote) {
          throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
        }

        if (quote.artisanId !== artisanId) {
          throw new AppError('You can only respond to your own quote requests', 403, 'FORBIDDEN');
        }

        // Validate current status
        if (!['PENDING', 'COUNTER_OFFERED'].includes(quote.status)) {
          throw new AppError(
            'This quote cannot be responded to in its current state',
            400,
            'INVALID_QUOTE_STATUS',
          );
        }

        // Check if expired
        if (quote.expiresAt && quote.expiresAt < new Date()) {
          await tx.quoteRequest.update({
            where: { id },
            data: { status: QuoteStatus.EXPIRED },
          });
          throw new AppError('This quote request has expired', 400, 'QUOTE_EXPIRED');
        }

        let newStatus: QuoteStatus;
        let finalPrice: number | undefined;
        let updateData: any = {
          artisanMessage: data.message,
          updatedAt: new Date(),
        };

        switch (data.action) {
          case QuoteAction.ACCEPT:
            newStatus = QuoteStatus.ACCEPTED;
            // Set final price to customer's requested price or existing counter offer
            finalPrice = quote.counterOffer
              ? Number(quote.counterOffer)
              : quote.requestedPrice
                ? Number(quote.requestedPrice)
                : Number(quote.product.price);
            updateData.finalPrice = finalPrice;
            updateData.status = newStatus;
            break;

          case QuoteAction.REJECT:
            newStatus = QuoteStatus.REJECTED;
            updateData.status = newStatus;
            break;

          case QuoteAction.COUNTER:
            if (!data.counterOffer || data.counterOffer <= 0) {
              throw new AppError(
                'Counter offer amount is required and must be greater than 0',
                400,
                'INVALID_COUNTER_OFFER',
              );
            }
            newStatus = QuoteStatus.COUNTER_OFFERED;
            updateData.counterOffer = data.counterOffer;
            updateData.status = newStatus;
            break;

          default:
            throw new AppError('Invalid action', 400, 'INVALID_ACTION');
        }

        // Update quote
        await tx.quoteRequest.update({
          where: { id },
          data: updateData,
        });

        // Add negotiation entry with proper data
        await this.createNegotiationEntry(id, {
          action: data.action,
          actor: 'artisan',
          previousPrice: quote.counterOffer
            ? Number(quote.counterOffer)
            : quote.requestedPrice
              ? Number(quote.requestedPrice)
              : undefined,
          newPrice: data.action === QuoteAction.COUNTER ? data.counterOffer : finalPrice,
          message: data.message,
          metadata: {
            oldStatus: quote.status,
            newStatus: newStatus,
          },
        });

        return (await this.findByIdWithDetails(id)) as QuoteRequestWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error responding to quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to respond to quote', 500, 'QUOTE_RESPONSE_FAILED');
    }
  }

  async findByIdWithDetails(id: string): Promise<QuoteRequestWithDetails | null> {
    try {
      const quote = await this.prisma.quoteRequest.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
              discountPrice: true,
              isCustomizable: true,
              status: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              avatarUrl: true,
            },
          },
          artisan: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                  isVerified: true,
                  rating: true,
                },
              },
            },
          },
        },
      });

      if (!quote) return null;

      // Transform negotiation history
      const negotiationHistory: QuoteNegotiation[] = quote.negotiationHistory.map((entry) => ({
        id: entry.id,
        action: entry.action as QuoteAction,
        actor: entry.actor as 'customer' | 'artisan',
        previousPrice: entry.previousPrice ? Number(entry.previousPrice) : undefined,
        newPrice: entry.newPrice ? Number(entry.newPrice) : undefined,
        message: entry.message,
        timestamp: entry.timestamp,
      }));

      return {
        ...quote,
        requestedPrice: quote.requestedPrice ? Number(quote.requestedPrice) : undefined,
        counterOffer: quote.counterOffer ? Number(quote.counterOffer) : undefined,
        finalPrice: quote.finalPrice ? Number(quote.finalPrice) : undefined,
        product: {
          ...quote.product,
          price: Number(quote.product.price),
          discountPrice: quote.product.discountPrice
            ? Number(quote.product.discountPrice)
            : undefined,
        },
        negotiationHistory,
      } as QuoteRequestWithDetails;
    } catch (error) {
      this.logger.error(`Error finding quote with details: ${error}`);
      return null;
    }
  }

  async getQuotes(options: QuoteQueryOptions): Promise<PaginatedResult<QuoteSummary>> {
    try {
      const {
        page = 1,
        limit = 10,
        customerId,
        artisanId,
        productId,
        status,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.QuoteRequestWhereInput = {};

      // Filters
      if (customerId) where.customerId = customerId;
      if (artisanId) where.artisanId = artisanId;
      if (productId) where.productId = productId;
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const total = await this.prisma.quoteRequest.count({ where });

      const quotes = await this.prisma.quoteRequest.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              images: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          artisan: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              artisanProfile: {
                select: { shopName: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const quoteSummaries: QuoteSummary[] = quotes.map((quote) => ({
        id: quote.id,
        productName: quote.product.name,
        productImages: quote.product.images,
        status: quote.status as QuoteStatus,
        requestedPrice: quote.requestedPrice ? Number(quote.requestedPrice) : undefined,
        counterOffer: quote.counterOffer ? Number(quote.counterOffer) : undefined,
        finalPrice: quote.finalPrice ? Number(quote.finalPrice) : undefined,
        createdAt: quote.createdAt,
        expiresAt: quote.expiresAt,
        customer: quote.customer
          ? {
              id: quote.customer.id,
              name: `${quote.customer.firstName} ${quote.customer.lastName}`,
              username: quote.customer.username,
            }
          : undefined,
        artisan: quote.artisan
          ? {
              id: quote.artisan.id,
              name: `${quote.artisan.firstName} ${quote.artisan.lastName}`,
              shopName: quote.artisan.artisanProfile?.shopName,
            }
          : undefined,
      }));

      return {
        data: quoteSummaries,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting quotes: ${error}`);
      throw new AppError('Failed to get quotes', 500, 'QUOTE_QUERY_FAILED');
    }
  }

  async getCustomerQuotes(
    customerId: string,
    options: Partial<QuoteQueryOptions> = {},
  ): Promise<PaginatedResult<QuoteSummary>> {
    return this.getQuotes({ ...options, customerId });
  }

  async getArtisanQuotes(
    artisanId: string,
    options: Partial<QuoteQueryOptions> = {},
  ): Promise<PaginatedResult<QuoteSummary>> {
    return this.getQuotes({ ...options, artisanId });
  }

  async addMessage(id: string, data: AddQuoteMessageDto): Promise<QuoteRequestWithDetails> {
    try {
      const updateField = data.isCustomerMessage ? 'customerMessage' : 'artisanMessage';

      await this.prisma.quoteRequest.update({
        where: { id },
        data: {
          [updateField]: data.message,
          updatedAt: new Date(),
        },
      });

      // Add negotiation entry
      await this.createNegotiationEntry(id, {
        action: QuoteAction.MESSAGE,
        actor: data.isCustomerMessage ? 'customer' : 'artisan',
        message: data.message,
      });

      return (await this.findByIdWithDetails(id)) as QuoteRequestWithDetails;
    } catch (error) {
      this.logger.error(`Error adding message to quote: ${error}`);
      throw new AppError('Failed to add message to quote', 500, 'QUOTE_MESSAGE_FAILED');
    }
  }

  async getNegotiationHistory(id: string): Promise<QuoteNegotiation[]> {
    try {
      const entries = await this.prisma.quoteNegotiation.findMany({
        where: { quoteId: id },
        orderBy: { timestamp: 'asc' },
      });

      return entries.map((entry) => ({
        id: entry.id,
        action: entry.action as QuoteAction,
        actor: entry.actor as 'customer' | 'artisan',
        previousPrice: entry.previousPrice ? Number(entry.previousPrice) : undefined,
        newPrice: entry.newPrice ? Number(entry.newPrice) : undefined,
        message: entry.message,
        timestamp: entry.timestamp,
      }));
    } catch (error) {
      this.logger.error(`Error getting negotiation history: ${error}`);
      return [];
    }
  }

  async createNegotiationEntry(
    quoteId: string,
    data: CreateNegotiationEntryDto,
  ): Promise<QuoteNegotiationHistory> {
    try {
      const entry = await this.prisma.quoteNegotiation.create({
        data: {
          quoteId,
          action: data.action,
          actor: data.actor,
          previousPrice: data.previousPrice,
          newPrice: data.newPrice,
          message: data.message,
          metadata: data.metadata,
        },
      });

      return {
        id: entry.id,
        quoteId: entry.quoteId,
        action: entry.action,
        actor: entry.actor as 'customer' | 'artisan',
        previousPrice: entry.previousPrice ? Number(entry.previousPrice) : undefined,
        newPrice: entry.newPrice ? Number(entry.newPrice) : undefined,
        message: entry.message,
        metadata: entry.metadata as Record<string, any>,
        timestamp: entry.timestamp,
      };
    } catch (error) {
      this.logger.error(`Error creating negotiation entry: ${error}`);
      throw new AppError('Failed to create negotiation entry', 500, 'NEGOTIATION_ENTRY_FAILED');
    }
  }

  async updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    finalPrice?: number,
  ): Promise<QuoteRequestWithDetails> {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      if (finalPrice !== undefined) {
        updateData.finalPrice = finalPrice;
      }

      await this.prisma.quoteRequest.update({
        where: { id },
        data: updateData,
      });

      return (await this.findByIdWithDetails(id)) as QuoteRequestWithDetails;
    } catch (error) {
      this.logger.error(`Error updating quote status: ${error}`);
      throw new AppError('Failed to update quote status', 500, 'QUOTE_UPDATE_FAILED');
    }
  }

  async markAsCompleted(id: string): Promise<QuoteRequestWithDetails> {
    return this.updateQuoteStatus(id, QuoteStatus.COMPLETED);
  }

  async expireQuotes(): Promise<number> {
    try {
      const result = await this.prisma.quoteRequest.updateMany({
        where: {
          status: { in: [QuoteStatus.PENDING, QuoteStatus.COUNTER_OFFERED] },
          expiresAt: { lt: new Date() },
        },
        data: { status: QuoteStatus.EXPIRED },
      });

      this.logger.info(`Expired ${result.count} quote requests`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error expiring quotes: ${error}`);
      return 0;
    }
  }

  async isUserInvolvedInQuote(quoteId: string, userId: string): Promise<boolean> {
    try {
      const quote = await this.prisma.quoteRequest.findUnique({
        where: { id: quoteId },
        select: { customerId: true, artisanId: true },
      });

      if (!quote) return false;
      return quote.customerId === userId || quote.artisanId === userId;
    } catch (error) {
      this.logger.error(`Error checking user involvement in quote: ${error}`);
      return false;
    }
  }

  async canUserRespondToQuote(quoteId: string, userId: string): Promise<boolean> {
    try {
      const quote = await this.prisma.quoteRequest.findUnique({
        where: { id: quoteId },
        select: {
          artisanId: true,
          status: true,
          expiresAt: true,
        },
      });

      if (!quote) return false;

      // Only artisan can respond
      if (quote.artisanId !== userId) return false;

      // Check status
      if (!['PENDING', 'COUNTER_OFFERED'].includes(quote.status)) return false;

      // Check expiration
      if (quote.expiresAt && quote.expiresAt < new Date()) return false;

      return true;
    } catch (error) {
      this.logger.error(`Error checking quote response permission: ${error}`);
      return false;
    }
  }

  async getQuoteStats(userId?: string, role?: string): Promise<QuoteStats> {
    try {
      const where: Prisma.QuoteRequestWhereInput = {};

      if (userId && role) {
        if (role === 'CUSTOMER') {
          where.customerId = userId;
        } else if (role === 'ARTISAN') {
          where.artisanId = userId;
        }
      }

      const [totalStats, statusCounts] = await Promise.all([
        this.prisma.quoteRequest.aggregate({
          where,
          _count: { id: true },
        }),
        this.prisma.quoteRequest.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
      ]);

      const statusMap = new Map(statusCounts.map((s) => [s.status, s._count.id]));

      // Calculate average negotiation time (simplified)
      const acceptedQuotes = await this.prisma.quoteRequest.findMany({
        where: { ...where, status: QuoteStatus.ACCEPTED },
        select: { createdAt: true, updatedAt: true },
        take: 100, // Sample for performance
      });

      const avgNegotiationTime =
        acceptedQuotes.length > 0
          ? acceptedQuotes.reduce((acc, quote) => {
              return acc + (quote.updatedAt.getTime() - quote.createdAt.getTime());
            }, 0) /
            acceptedQuotes.length /
            (1000 * 60 * 60) // Convert to hours
          : 0;

      // Calculate conversion rate (accepted quotes / total quotes)
      const totalQuotes = totalStats._count.id || 0;
      const acceptedCount = statusMap.get(QuoteStatus.ACCEPTED) || 0;
      const conversionRate = totalQuotes > 0 ? (acceptedCount / totalQuotes) * 100 : 0;

      return {
        totalQuotes,
        pendingQuotes: statusMap.get(QuoteStatus.PENDING) || 0,
        acceptedQuotes: acceptedCount,
        rejectedQuotes: statusMap.get(QuoteStatus.REJECTED) || 0,
        expiredQuotes: statusMap.get(QuoteStatus.EXPIRED) || 0,
        averageNegotiationTime: Math.round(avgNegotiationTime * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error getting quote stats: ${error}`);
      throw new AppError('Failed to get quote stats', 500, 'QUOTE_STATS_FAILED');
    }
  }
}

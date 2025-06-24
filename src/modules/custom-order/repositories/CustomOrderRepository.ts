import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICustomOrderRepository } from './CustomOrderRepository.interface';
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
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class CustomOrderRepository
  extends BasePrismaRepository<CustomOrderRequest, string>
  implements ICustomOrderRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'quoteRequest');
  }

  async createCustomOrder(
    customerId: string,
    data: CreateCustomOrderDto,
  ): Promise<CustomOrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate artisan exists
        const artisan = await tx.user.findUnique({
          where: { id: data.artisanId, role: 'ARTISAN' },
          include: {
            artisanProfile: {
              select: { shopName: true, isVerified: true, rating: true },
            },
          },
        });

        if (!artisan) {
          throw AppError.notFound('Artisan not found or invalid', 'ARTISAN_NOT_FOUND');
        }

        // Validate reference product if provided
        if (data.referenceProductId) {
          const product = await tx.product.findUnique({
            where: { id: data.referenceProductId, sellerId: data.artisanId },
          });

          if (!product) {
            throw AppError.notFound('Reference product not found', 'PRODUCT_NOT_FOUND');
          }
        }

        // Check for existing active orders
        const existingOrder = await tx.quoteRequest.findFirst({
          where: {
            customerId,
            artisanId: data.artisanId,
            status: { in: ['PENDING', 'COUNTER_OFFERED'] },
          },
        });

        if (existingOrder) {
          throw AppError.conflict(
            'You already have an active custom order with this artisan',
            'ACTIVE_ORDER_EXISTS',
          );
        }

        // Calculate expiration
        const expiresAt = data.expiresInDays
          ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create initial negotiation history
        const initialHistory = [
          {
            action: 'CREATE',
            actor: 'customer',
            timestamp: new Date().toISOString(),
            data: {
              title: data.title,
              description: data.description,
              estimatedPrice: data.estimatedPrice,
              customerBudget: data.customerBudget,
              timeline: data.timeline,
            },
          },
        ];

        // Create custom order
        const order = await tx.quoteRequest.create({
          data: {
            customerId,
            artisanId: data.artisanId,
            title: data.title,
            description: data.description,
            referenceProductId: data.referenceProductId,
            specifications: data.specifications,
            attachmentUrls: data.attachmentUrls || [],
            estimatedPrice: data.estimatedPrice,
            customerBudget: data.customerBudget,
            timeline: data.timeline,
            status: QuoteStatus.PENDING,
            negotiationHistory: initialHistory,
            expiresAt,
          },
        });

        return (await this.findByIdWithDetails(order.id)) as CustomOrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error creating custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create custom order', 'CREATE_ORDER_FAILED');
    }
  }

  async respondToCustomOrder(
    id: string,
    artisanId: string,
    data: ArtisanResponseDto,
  ): Promise<CustomOrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get current order
        const order = await tx.quoteRequest.findUnique({
          where: { id },
        });

        if (!order) {
          throw AppError.notFound('Custom order not found', 'ORDER_NOT_FOUND');
        }

        if (order.artisanId !== artisanId) {
          throw AppError.forbidden('You can only respond to your own orders', 'FORBIDDEN');
        }

        if (!['PENDING', 'COUNTER_OFFERED'].includes(order.status)) {
          throw AppError.badRequest('Cannot respond to order in current status', 'INVALID_STATUS');
        }

        // Check expiration
        if (order.expiresAt && order.expiresAt < new Date()) {
          await tx.quoteRequest.update({
            where: { id },
            data: { status: QuoteStatus.EXPIRED },
          });
          throw AppError.badRequest('This custom order has expired', 'ORDER_EXPIRED');
        }

        let newStatus: QuoteStatus;
        const updateData: any = {
          artisanResponse: data.response,
          updatedAt: new Date(),
        };

        // Update negotiation history
        const currentHistory = Array.isArray(order.negotiationHistory)
          ? order.negotiationHistory
          : [];

        const newHistoryEntry = {
          action: data.action,
          actor: 'artisan',
          timestamp: new Date().toISOString(),
          data: {
            response: data.response,
            finalPrice: data.finalPrice,
          },
        };

        updateData.negotiationHistory = [...currentHistory, newHistoryEntry];

        switch (data.action) {
          case 'ACCEPT':
            newStatus = QuoteStatus.ACCEPTED;
            if (data.finalPrice) {
              updateData.finalPrice = data.finalPrice;
            }
            break;
          case 'REJECT':
            newStatus = QuoteStatus.REJECTED;
            break;
          case 'COUNTER_OFFER':
            newStatus = QuoteStatus.COUNTER_OFFERED;
            if (data.finalPrice) {
              updateData.finalPrice = data.finalPrice;
            }
            // Update expiration if provided
            if (data.expiresInDays) {
              updateData.expiresAt = new Date(
                Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000,
              );
            }
            break;
          default:
            throw AppError.badRequest('Invalid action', 'INVALID_ACTION');
        }

        updateData.status = newStatus;

        // Update order
        await tx.quoteRequest.update({
          where: { id },
          data: updateData,
        });

        return (await this.findByIdWithDetails(id)) as CustomOrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error responding to custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to respond to custom order', 'RESPONSE_FAILED');
    }
  }

  async findByIdWithDetails(id: string): Promise<CustomOrderWithDetails | null> {
    try {
      const order = await this.prisma.quoteRequest.findUnique({
        where: { id },
        include: {
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
          referenceProduct: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
            },
          },
        },
      });

      if (!order) return null;

      // Get messages for this quote request
      const messages = await this.getOrderMessages(id);

      return {
        ...order,
        estimatedPrice: order.estimatedPrice ? Number(order.estimatedPrice) : null,
        customerBudget: order.customerBudget ? Number(order.customerBudget) : null,
        finalPrice: order.finalPrice ? Number(order.finalPrice) : null,
        referenceProduct: order.referenceProduct
          ? {
              ...order.referenceProduct,
              price: Number(order.referenceProduct.price),
            }
          : null,
        messages,
      } as CustomOrderWithDetails;
    } catch (error) {
      this.logger.error(`Error finding custom order by ID: ${error}`);
      return null;
    }
  }

  async getOrderMessages(quoteRequestId: string): Promise<any[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { quoteRequestId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return messages;
    } catch (error) {
      this.logger.error(`Error getting order messages: ${error}`);
      return [];
    }
  }

  async updateCustomOrder(
    id: string,
    customerId: string,
    data: UpdateCustomOrderDto,
  ): Promise<CustomOrderWithDetails> {
    try {
      const order = await this.prisma.quoteRequest.findUnique({
        where: { id },
        select: { customerId: true, status: true, negotiationHistory: true },
      });

      if (!order) {
        throw AppError.notFound('Custom order not found', 'ORDER_NOT_FOUND');
      }

      if (order.customerId !== customerId) {
        throw AppError.forbidden('You can only update your own orders', 'FORBIDDEN');
      }

      if (order.status !== QuoteStatus.PENDING) {
        throw AppError.badRequest('Cannot update order in current status', 'INVALID_STATUS');
      }

      // Add to negotiation history
      const currentHistory = Array.isArray(order.negotiationHistory)
        ? order.negotiationHistory
        : [];

      const historyEntry = {
        action: 'UPDATE',
        actor: 'customer',
        timestamp: new Date().toISOString(),
        data: data,
      };

      const updatedOrder = await this.prisma.quoteRequest.update({
        where: { id },
        data: {
          ...data,
          negotiationHistory: [...currentHistory, historyEntry],
          updatedAt: new Date(),
        },
      });

      return (await this.findByIdWithDetails(id)) as CustomOrderWithDetails;
    } catch (error) {
      this.logger.error(`Error updating custom order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update custom order', 'UPDATE_FAILED');
    }
  }

  async getCustomOrders(
    options: CustomOrderQueryOptions,
  ): Promise<PaginatedResult<CustomOrderWithDetails>> {
    try {
      const {
        page = 1,
        limit = 10,
        customerId,
        artisanId,
        status,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.QuoteRequestWhereInput = {};

      if (customerId) where.customerId = customerId;
      if (artisanId) where.artisanId = artisanId;
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const total = await this.prisma.quoteRequest.count({ where });

      const orders = await this.prisma.quoteRequest.findMany({
        where,
        include: {
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
          referenceProduct: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const messages = await this.getOrderMessages(order.id);
          return {
            ...order,
            estimatedPrice: order.estimatedPrice ? Number(order.estimatedPrice) : null,
            customerBudget: order.customerBudget ? Number(order.customerBudget) : null,
            finalPrice: order.finalPrice ? Number(order.finalPrice) : null,
            referenceProduct: order.referenceProduct
              ? {
                  ...order.referenceProduct,
                  price: Number(order.referenceProduct.price),
                }
              : null,
            messages,
          };
        }),
      );

      return {
        data: ordersWithDetails as CustomOrderWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting custom orders: ${error}`);
      throw AppError.internal('Failed to get custom orders', 'GET_ORDERS_FAILED');
    }
  }

  async getCustomerOrders(
    customerId: string,
    options: Partial<CustomOrderQueryOptions> = {},
  ): Promise<PaginatedResult<CustomOrderWithDetails>> {
    return this.getCustomOrders({ ...options, customerId });
  }

  async getArtisanOrders(
    artisanId: string,
    options: Partial<CustomOrderQueryOptions> = {},
  ): Promise<PaginatedResult<CustomOrderWithDetails>> {
    return this.getCustomOrders({ ...options, artisanId });
  }

  async updateStatus(id: string, status: QuoteStatus): Promise<CustomOrderWithDetails> {
    try {
      await this.prisma.quoteRequest.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      return (await this.findByIdWithDetails(id)) as CustomOrderWithDetails;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error}`);
      throw AppError.internal('Failed to update order status', 'UPDATE_STATUS_FAILED');
    }
  }

  async expireOldRequests(): Promise<number> {
    try {
      const result = await this.prisma.quoteRequest.updateMany({
        where: {
          status: { in: [QuoteStatus.PENDING, QuoteStatus.COUNTER_OFFERED] },
          expiresAt: { lt: new Date() },
        },
        data: { status: QuoteStatus.EXPIRED },
      });

      this.logger.info(`Expired ${result.count} custom order requests`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error expiring requests: ${error}`);
      return 0;
    }
  }

  async addNegotiationEntry(id: string, entry: any): Promise<CustomOrderWithDetails> {
    try {
      const order = await this.prisma.quoteRequest.findUnique({
        where: { id },
        select: { negotiationHistory: true },
      });

      if (!order) {
        throw AppError.notFound('Custom order not found', 'ORDER_NOT_FOUND');
      }

      const currentHistory = Array.isArray(order.negotiationHistory)
        ? order.negotiationHistory
        : [];

      await this.prisma.quoteRequest.update({
        where: { id },
        data: {
          negotiationHistory: [...currentHistory, entry],
          updatedAt: new Date(),
        },
      });

      return (await this.findByIdWithDetails(id)) as CustomOrderWithDetails;
    } catch (error) {
      this.logger.error(`Error adding negotiation entry: ${error}`);
      throw AppError.internal('Failed to add negotiation entry', 'ADD_ENTRY_FAILED');
    }
  }

  async getNegotiationHistory(id: string): Promise<any[]> {
    try {
      const order = await this.prisma.quoteRequest.findUnique({
        where: { id },
        select: { negotiationHistory: true },
      });

      return Array.isArray(order?.negotiationHistory) ? order.negotiationHistory : [];
    } catch (error) {
      this.logger.error(`Error getting negotiation history: ${error}`);
      return [];
    }
  }

  async isUserInvolvedInOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await this.prisma.quoteRequest.findUnique({
        where: { id: orderId },
        select: { customerId: true, artisanId: true },
      });

      if (!order) return false;
      return order.customerId === userId || order.artisanId === userId;
    } catch (error) {
      this.logger.error(`Error checking user involvement: ${error}`);
      return false;
    }
  }

  async canUserRespondToOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await this.prisma.quoteRequest.findUnique({
        where: { id: orderId },
        select: {
          artisanId: true,
          status: true,
          expiresAt: true,
        },
      });

      if (!order) return false;
      if (order.artisanId !== userId) return false;
      if (!['PENDING', 'COUNTER_OFFERED'].includes(order.status)) return false;
      if (order.expiresAt && order.expiresAt < new Date()) return false;

      return true;
    } catch (error) {
      this.logger.error(`Error checking response permission: ${error}`);
      return false;
    }
  }

  async getCustomOrderStats(userId?: string, role?: string): Promise<CustomOrderStats> {
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

      // Calculate average response time
      const acceptedOrders = await this.prisma.quoteRequest.findMany({
        where: { ...where, status: QuoteStatus.ACCEPTED },
        select: { createdAt: true, updatedAt: true },
        take: 100,
      });

      const avgResponseTime =
        acceptedOrders.length > 0
          ? acceptedOrders.reduce((acc, order) => {
              return acc + (order.updatedAt.getTime() - order.createdAt.getTime());
            }, 0) /
            acceptedOrders.length /
            (1000 * 60 * 60)
          : 0;

      const totalRequests = totalStats._count.id || 0;
      const acceptedCount = statusMap.get(QuoteStatus.ACCEPTED) || 0;
      const conversionRate = totalRequests > 0 ? (acceptedCount / totalRequests) * 100 : 0;

      return {
        totalRequests,
        pendingRequests: statusMap.get(QuoteStatus.PENDING) || 0,
        acceptedRequests: acceptedCount,
        rejectedRequests: statusMap.get(QuoteStatus.REJECTED) || 0,
        expiredRequests: statusMap.get(QuoteStatus.EXPIRED) || 0,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error getting custom order stats: ${error}`);
      throw AppError.internal('Failed to get stats', 'STATS_FAILED');
    }
  }
}

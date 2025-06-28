import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IPriceNegotiationRepository } from './PriceNegotiationRepository.interface';
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
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { PaginationUtils } from '../../../shared/utils/PaginationUtils';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class PriceNegotiationRepository
  extends BasePrismaRepository<PriceNegotiation, string>
  implements IPriceNegotiationRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'priceNegotiation');
  }

  // Thêm method mới để handle atomic check and create
  async checkAndCreateNegotiation(
    customerId: string,
    data: CreateNegotiationDto,
  ): Promise<{
    negotiation: PriceNegotiationWithDetails;
    isNew: boolean;
  }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Check existing negotiation first (trong transaction)
        const whereCondition: any = {
          productId: data.productId,
          customerId,
          status: { in: ['PENDING', 'COUNTER_OFFERED'] },
        };

        if (data.variantId) {
          whereCondition.variantId = data.variantId;
        } else {
          whereCondition.variantId = null;
        }

        const existingNegotiation = await tx.priceNegotiation.findFirst({
          where: whereCondition,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                discountPrice: true,
                quantity: true,
                allowNegotiation: true,
                status: true,
                hasVariants: true,
                seller: {
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
                      },
                    },
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                quantity: true,
                images: true,
                attributes: true,
                isActive: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                role: true,
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
                  },
                },
              },
            },
          },
        });

        // 2. If existing found, return it
        if (existingNegotiation) {
          return {
            negotiation: this.transformToNegotiationWithDetails(existingNegotiation),
            isNew: false,
          };
        }

        // 3. If not existing, create new (rest of existing createNegotiation logic)
        const product = await tx.product.findUnique({
          where: { id: data.productId },
          include: {
            seller: {
              include: {
                artisanProfile: {
                  select: { shopName: true, isVerified: true },
                },
              },
            },
            variants: data.variantId
              ? {
                  where: { id: data.variantId, isActive: true },
                }
              : undefined,
          },
        });

        if (!product) {
          throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
        }

        if (product.status !== 'PUBLISHED') {
          throw new AppError(
            'Product is not available for price negotiation',
            400,
            'PRODUCT_NOT_AVAILABLE',
          );
        }

        if (!product.allowNegotiation) {
          throw new AppError(
            'This product does not allow price negotiation',
            400,
            'NEGOTIATION_NOT_ALLOWED',
          );
        }

        if (product.sellerId === customerId) {
          throw new AppError(
            'You cannot negotiate price for your own product',
            400,
            'CANNOT_NEGOTIATE_OWN_PRODUCT',
          );
        }

        // Validate variant if provided
        let variant = null;
        if (data.variantId) {
          if (!product.hasVariants) {
            throw new AppError('This product does not have variants', 400, 'PRODUCT_NO_VARIANTS');
          }

          variant = product.variants?.[0];
          if (!variant) {
            throw new AppError('Product variant not found or inactive', 404, 'VARIANT_NOT_FOUND');
          }
        }

        // Calculate original price
        const originalPrice = variant
          ? variant.discountPrice || variant.price
          : product.discountPrice || product.price;

        // Calculate expiration date
        const expiresAt = data.expiresInDays
          ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        // Create new negotiation
        const negotiation = await tx.priceNegotiation.create({
          data: {
            productId: data.productId,
            variantId: data.variantId || null,
            customerId,
            artisanId: product.sellerId,
            originalPrice,
            proposedPrice: data.proposedPrice,
            quantity: data.quantity || 1,
            customerReason: data.customerReason,
            status: NegotiationStatus.PENDING,
            expiresAt,
            negotiationHistory: [
              {
                action: 'PROPOSE',
                actor: 'customer',
                price: data.proposedPrice,
                reason: data.customerReason,
                variantId: data.variantId,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        });

        this.logger.info(
          `New negotiation created: ${negotiation.id} for customer ${customerId}, product ${data.productId}${data.variantId ? `, variant ${data.variantId}` : ''}`,
        );

        const fullNegotiation = await tx.priceNegotiation.findUnique({
          where: { id: negotiation.id },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                discountPrice: true,
                quantity: true,
                allowNegotiation: true,
                status: true,
                hasVariants: true,
                seller: {
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
                      },
                    },
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                quantity: true,
                images: true,
                attributes: true,
                isActive: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                role: true,
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
                  },
                },
              },
            },
          },
        });

        if (!fullNegotiation) {
          throw new AppError(
            'Failed to retrieve created negotiation',
            500,
            'NEGOTIATION_RETRIEVAL_FAILED',
          );
        }

        return {
          negotiation: this.transformToNegotiationWithDetails(fullNegotiation),
          isNew: true,
        };
      });
    } catch (error) {
      this.logger.error(`Error in checkAndCreateNegotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create price negotiation', 500, 'NEGOTIATION_CREATION_FAILED');
    }
  }

  async createNegotiation(
    customerId: string,
    data: CreateNegotiationDto,
  ): Promise<PriceNegotiationWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate product exists and allows negotiation
        const product = await tx.product.findUnique({
          where: { id: data.productId },
          include: {
            seller: {
              include: {
                artisanProfile: {
                  select: { shopName: true, isVerified: true },
                },
              },
            },
            variants: data.variantId
              ? {
                  // NEW: Include variants if variantId provided
                  where: { id: data.variantId, isActive: true },
                }
              : undefined,
          },
        });

        if (!product) {
          throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
        }

        if (product.status !== 'PUBLISHED') {
          throw new AppError(
            'Product is not available for price negotiation',
            400,
            'PRODUCT_NOT_AVAILABLE',
          );
        }

        if (!product.allowNegotiation) {
          throw new AppError(
            'This product does not allow price negotiation',
            400,
            'NEGOTIATION_NOT_ALLOWED',
          );
        }

        if (product.sellerId === customerId) {
          throw new AppError(
            'You cannot negotiate price for your own product',
            400,
            'CANNOT_NEGOTIATE_OWN_PRODUCT',
          );
        }

        // NEW: Validate variant if provided
        let variant = null;
        if (data.variantId) {
          if (!product.hasVariants) {
            throw new AppError('This product does not have variants', 400, 'PRODUCT_NO_VARIANTS');
          }

          variant = product.variants?.[0]; // Since we filtered by id, should be the first one
          if (!variant) {
            throw new AppError('Product variant not found or inactive', 404, 'VARIANT_NOT_FOUND');
          }
        }

        // Check for existing active negotiations (updated with variant)
        const whereCondition: any = {
          productId: data.productId,
          customerId,
          status: { in: ['PENDING', 'COUNTER_OFFERED'] },
        };

        // NEW: Include variantId in the check
        if (data.variantId) {
          whereCondition.variantId = data.variantId;
        } else {
          whereCondition.variantId = null;
        }

        const existingNegotiation = await tx.priceNegotiation.findFirst({
          where: whereCondition,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                discountPrice: true,
                quantity: true,
                allowNegotiation: true,
                status: true,
                hasVariants: true, // NEW
                seller: {
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
                      },
                    },
                  },
                },
              },
            },
            variant: {
              // NEW
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                quantity: true,
                images: true,
                attributes: true,
                isActive: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                role: true, // NEW
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
                  },
                },
              },
            },
          },
        });

        if (existingNegotiation) {
          return this.transformToNegotiationWithDetails(existingNegotiation);
        }

        // Calculate original price (NEW: consider variant price)
        const originalPrice = variant
          ? variant.discountPrice || variant.price
          : product.discountPrice || product.price;

        // Calculate expiration date
        const expiresAt = data.expiresInDays
          ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Default 3 days

        // Create new negotiation
        const negotiation = await tx.priceNegotiation.create({
          data: {
            productId: data.productId,
            variantId: data.variantId || null, // NEW
            customerId,
            artisanId: product.sellerId,
            originalPrice,
            proposedPrice: data.proposedPrice,
            quantity: data.quantity || 1,
            customerReason: data.customerReason,
            status: NegotiationStatus.PENDING,
            expiresAt,
            negotiationHistory: [
              {
                action: 'PROPOSE',
                actor: 'customer',
                price: data.proposedPrice,
                reason: data.customerReason,
                variantId: data.variantId, // NEW: Include variant info in history
                timestamp: new Date().toISOString(),
              },
            ],
          },
        });

        this.logger.info(
          `New negotiation created: ${negotiation.id} for customer ${customerId}, product ${data.productId}${data.variantId ? `, variant ${data.variantId}` : ''}`,
        );

        const fullNegotiation = await tx.priceNegotiation.findUnique({
          where: { id: negotiation.id },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                discountPrice: true,
                quantity: true,
                allowNegotiation: true,
                status: true,
                hasVariants: true,
                seller: {
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
                      },
                    },
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                quantity: true,
                images: true,
                attributes: true,
                isActive: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                role: true,
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
                  },
                },
              },
            },
          },
        });

        if (!fullNegotiation) {
          throw new AppError(
            'Failed to retrieve created negotiation',
            500,
            'NEGOTIATION_RETRIEVAL_FAILED',
          );
        }

        return this.transformToNegotiationWithDetails(fullNegotiation);
      });
    } catch (error) {
      this.logger.error(`Error creating price negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create price negotiation', 500, 'NEGOTIATION_CREATION_FAILED');
    }
  }

  async respondToNegotiation(
    id: string,
    userId: string,
    data: RespondToNegotiationDto,
    respondingAs: 'artisan' | 'customer',
  ): Promise<PriceNegotiationWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const negotiation = await tx.priceNegotiation.findUnique({
          where: { id },
        });

        if (!negotiation) {
          throw new AppError('Price negotiation not found', 404, 'NEGOTIATION_NOT_FOUND');
        }

        // Check if expired
        if (negotiation.expiresAt && negotiation.expiresAt < new Date()) {
          await tx.priceNegotiation.update({
            where: { id },
            data: { status: NegotiationStatus.EXPIRED },
          });
          throw new AppError('This price negotiation has expired', 400, 'NEGOTIATION_EXPIRED');
        }

        let newStatus: NegotiationStatus;
        let finalPrice: number | undefined;
        let updateData: any = {
          updatedAt: new Date(),
        };

        // Get current history
        const currentHistory = (negotiation.negotiationHistory as any[]) || [];

        switch (data.action) {
          case 'ACCEPT':
            newStatus = NegotiationStatus.ACCEPTED;
            finalPrice = Number(negotiation.proposedPrice);
            updateData.finalPrice = finalPrice;
            updateData.status = newStatus;

            // Set response field based on who is responding
            if (respondingAs === 'artisan') {
              updateData.artisanResponse = data.artisanResponse;
            }

            currentHistory.push({
              action: 'ACCEPT',
              actor: respondingAs,
              acceptedPrice: finalPrice,
              response: data.artisanResponse || data.customerResponse,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'REJECT':
            newStatus = NegotiationStatus.REJECTED;
            updateData.status = newStatus;

            if (respondingAs === 'artisan') {
              updateData.artisanResponse = data.artisanResponse;
            }

            currentHistory.push({
              action: 'REJECT',
              actor: respondingAs,
              response: data.artisanResponse || data.customerResponse,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'COUNTER':
            if (!data.counterPrice || data.counterPrice <= 0) {
              throw new AppError(
                'Counter price is required and must be greater than 0',
                400,
                'INVALID_COUNTER_PRICE',
              );
            }

            newStatus = NegotiationStatus.COUNTER_OFFERED;
            updateData.proposedPrice = data.counterPrice;
            updateData.status = newStatus;

            if (respondingAs === 'artisan') {
              updateData.artisanResponse = data.artisanResponse;
            }

            currentHistory.push({
              action: 'COUNTER',
              actor: respondingAs,
              previousPrice: Number(negotiation.proposedPrice),
              newPrice: data.counterPrice,
              response: data.artisanResponse || data.customerResponse,
              timestamp: new Date().toISOString(),
            });
            break;

          default:
            throw new AppError('Invalid action', 400, 'INVALID_ACTION');
        }

        updateData.negotiationHistory = currentHistory;

        // Update negotiation
        await tx.priceNegotiation.update({
          where: { id },
          data: updateData,
        });

        return (await this.findByIdWithDetails(id)) as PriceNegotiationWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error responding to price negotiation: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to respond to price negotiation',
        500,
        'NEGOTIATION_RESPONSE_FAILED',
      );
    }
  }

  async findByIdWithDetails(id: string): Promise<PriceNegotiationWithDetails | null> {
    try {
      const negotiation = await this.prisma.priceNegotiation.findUnique({
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
              quantity: true,
              allowNegotiation: true,
              status: true,
              hasVariants: true, // NEW
              seller: {
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
                    },
                  },
                },
              },
            },
          },
          variant: {
            // NEW
            select: {
              id: true,
              name: true,
              price: true,
              discountPrice: true,
              quantity: true,
              images: true,
              attributes: true,
              isActive: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              role: true, // NEW
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
                },
              },
            },
          },
        },
      });

      if (!negotiation) {
        return null;
      }

      return this.transformToNegotiationWithDetails(negotiation);
    } catch (error) {
      this.logger.error(`Error finding negotiation with details: ${error}`);
      return null;
    }
  }

  async getCustomerNegotiations(
    customerId: string,
    options: Partial<NegotiationQueryOptions> = {},
  ): Promise<PaginatedResult<NegotiationSummary>> {
    try {
      const {
        page = 1,
        limit = 10,
        productId,
        variantId,
        status,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.PriceNegotiationWhereInput = {
        customerId, // IMPORTANT: Filter by customerId (user is the one who sent the negotiation)
      };

      // Apply other filters
      if (productId) where.productId = productId;
      if (variantId) where.variantId = variantId;
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const skip = PaginationUtils.calculateSkip(page, limit);

      const [negotiations, total] = await Promise.all([
        this.prisma.priceNegotiation.findMany({
          where,
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                attributes: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
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
          skip,
          take: limit,
        }),
        this.prisma.priceNegotiation.count({ where }),
      ]);

      const negotiationSummaries: NegotiationSummary[] = negotiations.map((negotiation) => ({
        id: negotiation.id,
        productName: negotiation.product.name,
        productImages: negotiation.product.images,
        variantId: negotiation.variantId,
        variantName: negotiation.variant?.name || null,
        variantAttributes: negotiation.variant?.attributes || null,
        originalPrice: Number(negotiation.originalPrice),
        proposedPrice: Number(negotiation.proposedPrice),
        finalPrice: negotiation.finalPrice ? Number(negotiation.finalPrice) : null,
        quantity: negotiation.quantity,
        status: negotiation.status as NegotiationStatus,
        createdAt: negotiation.createdAt,
        expiresAt: negotiation.expiresAt,
        customer: negotiation.customer
          ? {
              id: negotiation.customer.id,
              name: `${negotiation.customer.firstName} ${negotiation.customer.lastName}`,
              username: negotiation.customer.username,
              role: negotiation.customer.role,
            }
          : undefined,
        artisan: negotiation.artisan
          ? {
              id: negotiation.artisan.id,
              name: `${negotiation.artisan.firstName} ${negotiation.artisan.lastName}`,
              shopName: negotiation.artisan.artisanProfile?.shopName,
            }
          : undefined,
      }));

      return PaginationUtils.createPaginatedResult(negotiationSummaries, total, page, limit);
    } catch (error) {
      this.logger.error(`Error getting customer negotiations: ${error}`);
      throw new AppError('Failed to get customer negotiations', 500, 'NEGOTIATION_QUERY_FAILED');
    }
  }

  async getArtisanNegotiations(
    artisanId: string,
    options: Partial<NegotiationQueryOptions> = {},
  ): Promise<PaginatedResult<NegotiationSummary>> {
    try {
      const {
        page = 1,
        limit = 10,
        productId,
        variantId,
        status,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.PriceNegotiationWhereInput = {
        artisanId, // IMPORTANT: Filter by artisanId (user is the one who received the negotiation)
      };

      // Apply other filters
      if (productId) where.productId = productId;
      if (variantId) where.variantId = variantId;
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const skip = PaginationUtils.calculateSkip(page, limit);

      const [negotiations, total] = await Promise.all([
        this.prisma.priceNegotiation.findMany({
          where,
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                attributes: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
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
          skip,
          take: limit,
        }),
        this.prisma.priceNegotiation.count({ where }),
      ]);

      const negotiationSummaries: NegotiationSummary[] = negotiations.map((negotiation) => ({
        id: negotiation.id,
        productName: negotiation.product.name,
        productImages: negotiation.product.images,
        variantId: negotiation.variantId,
        variantName: negotiation.variant?.name || null,
        variantAttributes: negotiation.variant?.attributes || null,
        originalPrice: Number(negotiation.originalPrice),
        proposedPrice: Number(negotiation.proposedPrice),
        finalPrice: negotiation.finalPrice ? Number(negotiation.finalPrice) : null,
        quantity: negotiation.quantity,
        status: negotiation.status as NegotiationStatus,
        createdAt: negotiation.createdAt,
        expiresAt: negotiation.expiresAt,
        customer: negotiation.customer
          ? {
              id: negotiation.customer.id,
              name: `${negotiation.customer.firstName} ${negotiation.customer.lastName}`,
              username: negotiation.customer.username,
              role: negotiation.customer.role,
            }
          : undefined,
        artisan: negotiation.artisan
          ? {
              id: negotiation.artisan.id,
              name: `${negotiation.artisan.firstName} ${negotiation.artisan.lastName}`,
              shopName: negotiation.artisan.artisanProfile?.shopName,
            }
          : undefined,
      }));

      return PaginationUtils.createPaginatedResult(negotiationSummaries, total, page, limit);
    } catch (error) {
      this.logger.error(`Error getting artisan negotiations: ${error}`);
      throw new AppError('Failed to get artisan negotiations', 500, 'NEGOTIATION_QUERY_FAILED');
    }
  }

  async updateNegotiationStatus(
    id: string,
    status: NegotiationStatus,
    finalPrice?: number,
  ): Promise<PriceNegotiationWithDetails> {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      if (finalPrice !== undefined) {
        updateData.finalPrice = finalPrice;
      }

      await this.prisma.priceNegotiation.update({
        where: { id },
        data: updateData,
      });

      return (await this.findByIdWithDetails(id)) as PriceNegotiationWithDetails;
    } catch (error) {
      this.logger.error(`Error updating negotiation status: ${error}`);
      throw new AppError('Failed to update negotiation status', 500, 'NEGOTIATION_UPDATE_FAILED');
    }
  }

  async expireNegotiations(): Promise<number> {
    try {
      const result = await this.prisma.priceNegotiation.updateMany({
        where: {
          status: { in: [NegotiationStatus.PENDING, NegotiationStatus.COUNTER_OFFERED] },
          expiresAt: { lt: new Date() },
        },
        data: {
          status: NegotiationStatus.EXPIRED,
          updatedAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.info(`Expired ${result.count} price negotiations`);
      }

      return result.count;
    } catch (error) {
      this.logger.error(`Error expiring negotiations: ${error}`);
      return 0;
    }
  }

  async isUserInvolvedInNegotiation(negotiationId: string, userId: string): Promise<boolean> {
    try {
      const negotiation = await this.prisma.priceNegotiation.findUnique({
        where: { id: negotiationId },
        select: {
          customerId: true,
          artisanId: true,
          id: true,
        },
      });

      if (!negotiation) {
        this.logger.warn(`Negotiation not found: ${negotiationId}`);
        return false;
      }

      const isInvolved = negotiation.customerId === userId || negotiation.artisanId === userId;
      this.logger.info(`User ${userId} involved in negotiation ${negotiationId}: ${isInvolved}`);

      return isInvolved;
    } catch (error) {
      this.logger.error(`Error checking user involvement in negotiation: ${error}`);
      return false;
    }
  }

  async canUserRespondToNegotiation(negotiationId: string, userId: string): Promise<boolean> {
    try {
      const negotiation = await this.prisma.priceNegotiation.findUnique({
        where: { id: negotiationId },
        select: {
          artisanId: true,
          status: true,
          expiresAt: true,
        },
      });

      if (!negotiation) return false;

      // Only artisan can respond
      if (negotiation.artisanId !== userId) return false;

      // Check status
      if (!['PENDING', 'COUNTER_OFFERED'].includes(negotiation.status)) return false;

      // Check expiration
      if (negotiation.expiresAt && negotiation.expiresAt < new Date()) return false;

      return true;
    } catch (error) {
      this.logger.error(`Error checking negotiation response permission: ${error}`);
      return false;
    }
  }

  async hasActiveNegotiation(
    customerId: string,
    productId: string,
    variantId?: string, // NEW
  ): Promise<boolean> {
    try {
      const whereCondition: any = {
        customerId,
        productId,
        status: { in: ['PENDING', 'COUNTER_OFFERED'] },
      };

      // NEW: Include variantId in the check
      if (variantId) {
        whereCondition.variantId = variantId;
      } else {
        whereCondition.variantId = null;
      }

      const negotiation = await this.prisma.priceNegotiation.findFirst({
        where: whereCondition,
      });

      return !!negotiation;
    } catch (error) {
      this.logger.error(`Error checking active negotiation: ${error}`);
      return false;
    }
  }

  async checkExistingNegotiation(
    customerId: string,
    productId: string,
    variantId?: string, // NEW
  ): Promise<PriceNegotiationWithDetails | null> {
    try {
      const whereCondition: any = {
        customerId,
        productId,
        status: { in: ['PENDING', 'COUNTER_OFFERED', 'ACCEPTED'] },
      };

      // NEW: Include variantId in the check
      if (variantId) {
        whereCondition.variantId = variantId;
      } else {
        whereCondition.variantId = null;
      }

      const negotiation = await this.prisma.priceNegotiation.findFirst({
        where: whereCondition,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
              discountPrice: true,
              quantity: true,
              allowNegotiation: true,
              status: true,
              hasVariants: true, // NEW
              seller: {
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
                    },
                  },
                },
              },
            },
          },
          variant: {
            // NEW
            select: {
              id: true,
              name: true,
              price: true,
              discountPrice: true,
              quantity: true,
              images: true,
              attributes: true,
              isActive: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              role: true, // NEW
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
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!negotiation) {
        return null;
      }

      return this.transformToNegotiationWithDetails(negotiation);
    } catch (error) {
      this.logger.error(`Error checking existing negotiation: ${error}`);
      return null;
    }
  }

  async getNegotiationStats(
    userId?: string,
    type?: 'sent' | 'received',
  ): Promise<NegotiationStats> {
    try {
      const where: Prisma.PriceNegotiationWhereInput = {};

      if (userId && type) {
        if (type === 'sent') {
          // Stats for negotiations sent by user (user is customer)
          where.customerId = userId;
        } else if (type === 'received') {
          // Stats for negotiations received by user (user is artisan)
          where.artisanId = userId;
        }
      }

      const [totalStats, statusCounts, acceptedNegotiations] = await Promise.all([
        this.prisma.priceNegotiation.aggregate({
          where,
          _count: { id: true },
        }),
        this.prisma.priceNegotiation.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
        this.prisma.priceNegotiation.findMany({
          where: { ...where, status: NegotiationStatus.ACCEPTED },
          select: {
            originalPrice: true,
            finalPrice: true,
          },
        }),
      ]);

      const statusMap = new Map(statusCounts.map((s) => [s.status, s._count.id]));

      // Calculate average discount
      const avgDiscount =
        acceptedNegotiations.length > 0
          ? acceptedNegotiations.reduce((acc, neg) => {
              const originalPrice = Number(neg.originalPrice);
              const finalPrice = Number(neg.finalPrice);
              const discount = ((originalPrice - finalPrice) / originalPrice) * 100;
              return acc + discount;
            }, 0) / acceptedNegotiations.length
          : 0;

      // Calculate success rate
      const totalNegotiations = totalStats._count.id || 0;
      const acceptedCount = statusMap.get(NegotiationStatus.ACCEPTED) || 0;
      const successRate = totalNegotiations > 0 ? (acceptedCount / totalNegotiations) * 100 : 0;

      return {
        totalNegotiations,
        pendingNegotiations: statusMap.get(NegotiationStatus.PENDING) || 0,
        acceptedNegotiations: acceptedCount,
        rejectedNegotiations: statusMap.get(NegotiationStatus.REJECTED) || 0,
        expiredNegotiations: statusMap.get(NegotiationStatus.EXPIRED) || 0,
        averageDiscount: Math.round(avgDiscount * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error getting negotiation stats: ${error}`);
      throw new AppError('Failed to get negotiation stats', 500, 'NEGOTIATION_STATS_FAILED');
    }
  }

  private transformToNegotiationWithDetails(negotiation: any): PriceNegotiationWithDetails {
    return {
      ...negotiation,
      originalPrice: Number(negotiation.originalPrice),
      proposedPrice: Number(negotiation.proposedPrice),
      finalPrice: negotiation.finalPrice ? Number(negotiation.finalPrice) : null,
      product: {
        ...negotiation.product,
        price: Number(negotiation.product.price),
        discountPrice: negotiation.product.discountPrice
          ? Number(negotiation.product.discountPrice)
          : null,
      },
      variant: negotiation.variant
        ? {
            ...negotiation.variant,
            price: Number(negotiation.variant.price),
            discountPrice: negotiation.variant.discountPrice
              ? Number(negotiation.variant.discountPrice)
              : null,
          }
        : null,
    } as PriceNegotiationWithDetails;
  }
}

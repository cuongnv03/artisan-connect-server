import { PrismaClient, Product as PrismaProduct, Prisma } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { IProductRepository } from '../../../domain/product/repositories/ProductRepository.interface';
import {
  Product,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
} from '../../../domain/product/entities/Product';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';

export class ProductRepository
  extends BasePrismaRepository<Product, string>
  implements IProductRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'product');
  }

  /**
   * Find product by ID with details
   */
  async findByIdWithDetails(id: string): Promise<ProductWithDetails | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
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
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        priceHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    return product as unknown as ProductWithDetails;
  }

  /**
   * Create product
   */
  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails> {
    try {
      // Check for categories existence if provided
      if (data.categories && data.categories.length > 0) {
        const categoryCount = await this.prisma.category.count({
          where: {
            id: {
              in: data.categories,
            },
          },
        });

        if (categoryCount !== data.categories.length) {
          throw new AppError('One or more categories not found', 400, 'INVALID_CATEGORIES');
        }
      }

      // Create product and price history in a transaction
      const product = await this.prisma.$transaction(async (tx) => {
        // Create the product
        const newProduct = await tx.product.create({
          data: {
            sellerId,
            name: data.name,
            description: data.description,
            price: data.price,
            discountPrice: data.discountPrice,
            quantity: data.quantity,
            status: data.status,
            images: data.images,
            tags: data.tags || [],
            attributes: data.attributes,
            isCustomizable: data.isCustomizable,
            sku: data.sku,
            weight: data.weight,
            dimensions: data.dimensions as any,
            categories:
              data.categories && data.categories.length > 0
                ? {
                    connect: data.categories.map((id) => ({ id })),
                  }
                : undefined,
          },
          include: {
            seller: {
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
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        });

        // Create initial price history entry
        await tx.priceHistory.create({
          data: {
            productId: newProduct.id,
            price: data.price,
            changeNote: 'Initial price',
            changedBy: sellerId,
          },
        });

        // Get price history
        const priceHistory = await tx.priceHistory.findMany({
          where: { productId: newProduct.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          ...newProduct,
          priceHistory,
        };
      });

      return product as unknown as ProductWithDetails;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create product', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    sellerId: string,
    data: UpdateProductDto,
  ): Promise<ProductWithDetails> {
    try {
      // Check product exists and belongs to seller
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
      }

      // Check categories if provided
      if (data.categories && data.categories.length > 0) {
        const categoryCount = await this.prisma.category.count({
          where: {
            id: {
              in: data.categories,
            },
          },
        });

        if (categoryCount !== data.categories.length) {
          throw new AppError('One or more categories not found', 400, 'INVALID_CATEGORIES');
        }
      }

      // If price is updated, create a price history entry
      let updateTransaction;
      if (data.price !== undefined && data.price !== Number(product.price)) {
        updateTransaction = this.prisma.$transaction(async (tx) => {
          // Update product
          const updatedProduct = await tx.product.update({
            where: { id },
            data: {
              name: data.name,
              description: data.description,
              price: data.price,
              discountPrice: data.discountPrice,
              quantity: data.quantity,
              status: data.status,
              images: data.images,
              tags: data.tags,
              attributes: data.attributes,
              isCustomizable: data.isCustomizable,
              sku: data.sku,
              weight: data.weight,
              dimensions: data.dimensions as any,
              categories: data.categories
                ? {
                    set: [], // Remove existing connections
                    connect: data.categories.map((id) => ({ id })), // Create new connections
                  }
                : undefined,
            },
            include: {
              seller: {
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
              categories: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  reviews: true,
                },
              },
            },
          });

          // Create price history entry
          await tx.priceHistory.create({
            data: {
              productId: id,
              price: data.price,
              changeNote: 'Price updated during product edit',
              changedBy: sellerId,
            },
          });

          // Get price history
          const priceHistory = await tx.priceHistory.findMany({
            where: { productId: id },
            orderBy: { createdAt: 'desc' },
          });

          return {
            ...updatedProduct,
            priceHistory,
          };
        });
      } else {
        // Regular update without price change
        updateTransaction = this.prisma.$transaction(async (tx) => {
          const updatedProduct = await tx.product.update({
            where: { id },
            data: {
              name: data.name,
              description: data.description,
              discountPrice: data.discountPrice,
              quantity: data.quantity,
              status: data.status,
              images: data.images,
              tags: data.tags,
              attributes: data.attributes,
              isCustomizable: data.isCustomizable,
              sku: data.sku,
              weight: data.weight,
              dimensions: data.dimensions as any,
              categories: data.categories
                ? {
                    set: [], // Remove existing connections
                    connect: data.categories.map((id) => ({ id })), // Create new connections
                  }
                : undefined,
            },
            include: {
              seller: {
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
              categories: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  reviews: true,
                },
              },
            },
          });

          // Get price history
          const priceHistory = await tx.priceHistory.findMany({
            where: { productId: id },
            orderBy: { createdAt: 'desc' },
          });

          return {
            ...updatedProduct,
            priceHistory,
          };
        });
      }

      return updateTransaction as unknown as ProductWithDetails;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update product price
   */
  async updatePrice(
    id: string,
    sellerId: string,
    data: PriceUpdateDto,
  ): Promise<ProductWithDetails> {
    try {
      // Check product exists and belongs to seller
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
      }

      // Update price and create history in transaction
      const updatedProduct = await this.prisma.$transaction(async (tx) => {
        // Update product price
        const updatedProduct = await tx.product.update({
          where: { id },
          data: {
            price: data.price,
          },
          include: {
            seller: {
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
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        });

        // Create price history entry
        await tx.priceHistory.create({
          data: {
            productId: id,
            price: data.price,
            changeNote: data.changeNote || 'Price updated',
            changedBy: sellerId,
          },
        });

        // Get price history
        const priceHistory = await tx.priceHistory.findMany({
          where: { productId: id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          ...updatedProduct,
          priceHistory,
        };
      });

      return updatedProduct as unknown as ProductWithDetails;
    } catch (error) {
      this.logger.error(`Error updating product price: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product price', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string, sellerId: string): Promise<boolean> {
    try {
      // Check product exists and belongs to seller
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only delete your own products', 403, 'FORBIDDEN');
      }

      // Soft delete
      await this.prisma.product.update({
        where: { id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete product', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get products with pagination
   */
  async getProducts(options: ProductQueryOptions): Promise<PaginatedResult<Product>> {
    try {
      const {
        page = 1,
        limit = 10,
        sellerId,
        categoryId,
        search,
        minPrice,
        maxPrice,
        status,
        isCustomizable,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Build where conditions
      const where: Prisma.ProductWhereInput = {};

      if (sellerId) {
        where.sellerId = sellerId;
      }

      if (categoryId) {
        where.categories = {
          some: {
            id: categoryId,
          },
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ];
      }

      if (minPrice !== undefined) {
        where.price = {
          ...where.price,
          gte: minPrice,
        };
      }

      if (maxPrice !== undefined) {
        where.price = {
          ...where.price,
          lte: maxPrice,
        };
      }

      if (status && status.length > 0) {
        where.status = {
          in: status,
        };
      } else {
        // Default to published products only for public queries
        if (!sellerId) {
          where.status = 'PUBLISHED';
        }
      }

      if (isCustomizable !== undefined) {
        where.isCustomizable = isCustomizable;
      }

      // Exclude deleted products unless explicitly requested
      if (!status || !status.includes('DELETED')) {
        where.deletedAt = null;
      }

      // Count total matching products
      const total = await this.prisma.product.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get products with pagination
      const products = await this.prisma.product.findMany({
        where,
        include: {
          seller: {
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
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: products as unknown as Product[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting products: ${error}`);
      throw new AppError('Failed to get products', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get price history
   */
  async getPriceHistory(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<any>> {
    try {
      // Check product exists
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Count total price history entries
      const total = await this.prisma.priceHistory.count({
        where: { productId },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get price history with pagination
      const priceHistory = await this.prisma.priceHistory.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          changedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        data: priceHistory,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting price history: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get price history', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Check if product belongs to seller
   */
  async isProductOwner(productId: string, sellerId: string): Promise<boolean> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true },
      });

      return product?.sellerId === sellerId;
    } catch (error) {
      this.logger.error(`Error checking product ownership: ${error}`);
      return false;
    }
  }
}

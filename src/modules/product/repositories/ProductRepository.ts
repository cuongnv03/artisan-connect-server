import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IProductRepository } from './ProductRepository.interface';
import {
  Product,
  ProductWithSeller,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryOptions,
  ProductPaginationResult,
  PriceHistory,
  ProductStats,
} from '../models/Product';
import { ProductStatus } from '../models/ProductEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class ProductRepository
  extends BasePrismaRepository<Product, string>
  implements IProductRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'product');
  }

  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithSeller> {
    try {
      const slug = await this.generateSlug(data.name, sellerId);

      const product = await this.prisma.$transaction(async (tx) => {
        // Create product
        const product = await tx.product.create({
          data: {
            sellerId,
            name: data.name,
            slug,
            description: data.description,
            price: data.price,
            discountPrice: data.discountPrice,
            quantity: data.quantity,
            status: ProductStatus.DRAFT,
            images: data.images,
            tags: data.tags || [],
            isCustomizable: data.isCustomizable || false,
            viewCount: 0,
            salesCount: 0,
          },
        });

        // Link categories if provided
        if (data.categories && data.categories.length > 0) {
          await Promise.all(
            data.categories.map((categoryId) =>
              tx.categoryProduct.create({
                data: { productId: product.id, categoryId },
              }),
            ),
          );
        }

        // Create initial price history
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            price: data.price,
            changeNote: 'Initial price',
          },
        });

        return product;
      });

      return (await this.getProductById(product.id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      throw new AppError('Failed to create product', 500, 'PRODUCT_CREATE_ERROR');
    }
  }

  async updateProduct(
    id: string,
    sellerId: string,
    data: UpdateProductDto,
  ): Promise<ProductWithSeller> {
    try {
      // Check ownership
      const existingProduct = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, price: true, name: true },
      });

      if (!existingProduct) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (existingProduct.sellerId !== sellerId) {
        throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
      }

      const updateData: any = { ...data };

      // Generate new slug if name changed
      if (data.name && data.name !== existingProduct.name) {
        updateData.slug = await this.generateSlug(data.name, sellerId);
      }

      await this.prisma.$transaction(async (tx) => {
        // Update categories if provided
        if (data.categories !== undefined) {
          await tx.categoryProduct.deleteMany({ where: { productId: id } });
          if (data.categories.length > 0) {
            await Promise.all(
              data.categories.map((categoryId) =>
                tx.categoryProduct.create({
                  data: { productId: id, categoryId },
                }),
              ),
            );
          }
        }

        // Update product
        await tx.product.update({
          where: { id },
          data: updateData,
        });

        // Create price history if price changed
        if (data.price !== undefined && data.price !== Number(existingProduct.price)) {
          await tx.priceHistory.create({
            data: {
              productId: id,
              price: data.price,
              changeNote: 'Price updated',
            },
          });
        }
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500, 'PRODUCT_UPDATE_ERROR');
    }
  }

  async deleteProduct(id: string, sellerId: string): Promise<boolean> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only delete your own products', 403, 'FORBIDDEN');
      }

      await this.prisma.product.update({
        where: { id },
        data: {
          status: ProductStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete product', 500, 'PRODUCT_DELETE_ERROR');
    }
  }

  async getProductById(id: string): Promise<ProductWithSeller | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: { shopName: true, isVerified: true },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });

      if (!product) return null;

      return this.transformProductWithSeller(product);
    } catch (error) {
      this.logger.error(`Error getting product by ID: ${error}`);
      return null;
    }
  }

  async getProductBySlug(slug: string): Promise<ProductWithSeller | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { slug, deletedAt: null },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: { shopName: true, isVerified: true },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });

      if (!product) return null;

      return this.transformProductWithSeller(product);
    } catch (error) {
      this.logger.error(`Error getting product by slug: ${error}`);
      return null;
    }
  }

  async getProducts(options: ProductQueryOptions): Promise<ProductPaginationResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sellerId,
        categoryId,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        inStock,
      } = options;

      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
      };

      // Filters
      if (sellerId) {
        where.sellerId = sellerId;
        // Nếu là seller query, cho phép tất cả status
        if (status) {
          where.status = Array.isArray(status) ? { in: status } : status;
        }
      } else {
        // Đối với public query, chỉ hiển thị PUBLISHED và OUT_OF_STOCK
        if (status) {
          const allowedStatuses = Array.isArray(status) ? status : [status];
          const publicStatuses = allowedStatuses.filter((s) =>
            [ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK].includes(s),
          );
          if (publicStatuses.length > 0) {
            where.status = publicStatuses.length === 1 ? publicStatuses[0] : { in: publicStatuses };
          } else {
            where.status = { in: [ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK] };
          }
        } else {
          // Default: hiển thị cả PUBLISHED và OUT_OF_STOCK
          where.status = { in: [ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK] };
        }
      }
      if (inStock !== undefined) {
        where.quantity = inStock ? { gt: 0 } : { lte: 0 };
      }

      // Category filter
      if (categoryId) {
        where.categories = { some: { categoryId } };
      }

      // Search
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ];
      }

      const total = await this.prisma.product.count({ where });
      const totalPages = Math.ceil(total / limit);

      const products = await this.prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: { shopName: true, isVerified: true },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: products.map((product) => this.transformProductWithSeller(product)),
        meta: { total, page, limit, totalPages },
      };
    } catch (error) {
      this.logger.error(`Error getting products: ${error}`);
      throw new AppError('Failed to get products', 500, 'PRODUCT_GET_ERROR');
    }
  }

  async getMyProducts(
    sellerId: string,
    options: Omit<ProductQueryOptions, 'sellerId'> = {},
  ): Promise<ProductPaginationResult> {
    return this.getProducts({ ...options, sellerId });
  }

  async searchProducts(
    query: string,
    options: ProductQueryOptions = {},
  ): Promise<ProductPaginationResult> {
    return this.getProducts({ ...options, search: query, status: ProductStatus.PUBLISHED });
  }

  async updatePrice(
    id: string,
    sellerId: string,
    price: number,
    note?: string,
  ): Promise<ProductWithSeller> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: { price },
        });

        await tx.priceHistory.create({
          data: {
            productId: id,
            price,
            changeNote: note || 'Price updated',
          },
        });
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error updating price: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update price', 500, 'PRICE_UPDATE_ERROR');
    }
  }

  async getPriceHistory(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<PriceHistory>> {
    try {
      const total = await this.prisma.priceHistory.count({ where: { productId } });

      const history = await this.prisma.priceHistory.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: history as PriceHistory[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting price history: ${error}`);
      throw new AppError('Failed to get price history', 500, 'PRICE_HISTORY_ERROR');
    }
  }

  async publishProduct(id: string, sellerId: string): Promise<ProductWithSeller> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, quantity: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only publish your own products', 403, 'FORBIDDEN');
      }

      const status = product.quantity > 0 ? ProductStatus.PUBLISHED : ProductStatus.OUT_OF_STOCK;

      await this.prisma.product.update({
        where: { id },
        data: { status },
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error publishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish product', 500, 'PRODUCT_PUBLISH_ERROR');
    }
  }

  async unpublishProduct(id: string, sellerId: string): Promise<ProductWithSeller> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only unpublish your own products', 403, 'FORBIDDEN');
      }

      await this.prisma.product.update({
        where: { id },
        data: { status: ProductStatus.DRAFT },
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error unpublishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to unpublish product', 500, 'PRODUCT_UNPUBLISH_ERROR');
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(`Error incrementing view count: ${error}`);
      // Don't throw for view count updates
    }
  }

  async getProductStats(sellerId: string): Promise<ProductStats> {
    try {
      const [totalStats, publishedCount, draftCount] = await Promise.all([
        this.prisma.product.aggregate({
          where: { sellerId, deletedAt: null },
          _count: { id: true },
          _sum: { viewCount: true, salesCount: true },
        }),
        this.prisma.product.count({
          where: { sellerId, status: ProductStatus.PUBLISHED, deletedAt: null },
        }),
        this.prisma.product.count({
          where: { sellerId, status: ProductStatus.DRAFT, deletedAt: null },
        }),
      ]);

      return {
        totalProducts: totalStats._count.id || 0,
        publishedProducts: publishedCount,
        draftProducts: draftCount,
        totalViews: totalStats._sum.viewCount || 0,
        totalSales: totalStats._sum.salesCount || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting product stats: ${error}`);
      throw new AppError('Failed to get product stats', 500, 'PRODUCT_STATS_ERROR');
    }
  }

  async generateSlug(name: string, sellerId: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (baseSlug.length < 3) {
      baseSlug = `product-${baseSlug}`;
    }

    const existing = await this.prisma.product.findFirst({
      where: { slug: baseSlug, sellerId, deletedAt: null },
    });

    if (!existing) return baseSlug;

    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomStr}`;
  }

  async isProductOwner(productId: string, sellerId: string): Promise<boolean> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true },
      });
      return product?.sellerId === sellerId;
    } catch (error) {
      return false;
    }
  }

  private transformProductWithSeller(product: any): ProductWithSeller {
    return {
      ...product,
      categories: product.categories?.map((c: any) => c.category) || [],
    };
  }
}

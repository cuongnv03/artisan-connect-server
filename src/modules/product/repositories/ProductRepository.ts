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
  ProductVariant,
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
            minOrderQty: data.minOrderQty || 1,
            maxOrderQty: data.maxOrderQty,
            sku: data.sku,
            barcode: data.barcode,
            weight: data.weight,
            dimensions: data.dimensions,
            isCustomizable: data.isCustomizable || false,
            allowNegotiation: data.allowNegotiation ?? true,
            shippingInfo: data.shippingInfo,
            status: ProductStatus.DRAFT,
            tags: data.tags || [],
            images: data.images,
            featuredImage: data.featuredImage,
            seoTitle: data.seoTitle,
            seoDescription: data.seoDescription,
            attributes: data.attributes,
            specifications: data.specifications,
            customFields: data.customFields,
            hasVariants: (data.variants && data.variants.length > 0) || false,
            viewCount: 0,
            salesCount: 0,
            reviewCount: 0,
          },
        });

        // Link categories
        if (data.categoryIds && data.categoryIds.length > 0) {
          await Promise.all(
            data.categoryIds.map((categoryId) =>
              tx.categoryProduct.create({
                data: { productId: product.id, categoryId },
              }),
            ),
          );
        }

        // Create price history
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            price: data.price,
            changeNote: 'Initial price',
            changedBy: sellerId,
          },
        });

        // Create variants if provided
        if (data.variants && data.variants.length > 0) {
          for (const [index, variantData] of data.variants.entries()) {
            await tx.productVariant.create({
              data: {
                productId: product.id,
                sku: await this.generateVariantSku(product.id, variantData.attributes),
                name: variantData.name,
                price: variantData.price || data.price,
                discountPrice: variantData.discountPrice,
                quantity: variantData.quantity,
                images: variantData.images || [],
                weight: variantData.weight,
                dimensions: variantData.dimensions,
                attributes: variantData.attributes,
                isActive: variantData.isActive ?? true,
                isDefault: variantData.isDefault ?? index === 0,
                sortOrder: variantData.sortOrder ?? index,
              },
            });
          }
        }

        return product;
      });

      return (await this.getProductById(product.id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      throw AppError.internal('Failed to create product', 'PRODUCT_CREATE_ERROR');
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
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      if (existingProduct.sellerId !== sellerId) {
        throw AppError.forbidden('You can only update your own products', 'FORBIDDEN');
      }

      const updateData: any = { ...data };

      // Generate new slug if name changed
      if (data.name && data.name !== existingProduct.name) {
        updateData.slug = await this.generateSlug(data.name, sellerId);
      }

      await this.prisma.$transaction(async (tx) => {
        // Update categories if provided
        if (data.categoryIds !== undefined) {
          await tx.categoryProduct.deleteMany({ where: { productId: id } });
          if (data.categoryIds.length > 0) {
            await Promise.all(
              data.categoryIds.map((categoryId) =>
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
              changedBy: sellerId,
            },
          });
        }
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update product', 'PRODUCT_UPDATE_ERROR');
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
          variants: {
            orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
          },
          priceHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
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
          variants: {
            orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
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
        categoryIds,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        inStock,
        priceRange,
        hasVariants,
      } = options;

      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
      };

      // Filters
      if (sellerId) {
        where.sellerId = sellerId;
        if (status) {
          where.status = Array.isArray(status) ? { in: status } : status;
        }
      } else {
        // Public query - only show published products
        where.status = { in: [ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK] };
      }

      if (inStock !== undefined) {
        where.quantity = inStock ? { gt: 0 } : { lte: 0 };
      }

      if (hasVariants !== undefined) {
        where.hasVariants = hasVariants;
      }

      // Category filter
      if (categoryIds && categoryIds.length > 0) {
        where.categories = { some: { categoryId: { in: categoryIds } } };
      }

      // Price range filter
      if (priceRange) {
        where.price = {};
        if (priceRange.min !== undefined) where.price.gte = priceRange.min;
        if (priceRange.max !== undefined) where.price.lte = priceRange.max;
      }

      // Search
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
          { sku: { contains: search, mode: 'insensitive' } },
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
      throw AppError.internal('Failed to get products', 'PRODUCT_GET_ERROR');
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

  async deleteProduct(id: string, sellerId: string): Promise<boolean> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true },
      });

      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw AppError.forbidden('You can only delete your own products', 'FORBIDDEN');
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
      throw AppError.internal('Failed to delete product', 'PRODUCT_DELETE_ERROR');
    }
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
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw AppError.forbidden('You can only update your own products', 'FORBIDDEN');
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
            changedBy: sellerId,
          },
        });
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error updating price: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update price', 'PRICE_UPDATE_ERROR');
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
      throw AppError.internal('Failed to get price history', 'PRICE_HISTORY_ERROR');
    }
  }

  async publishProduct(id: string, sellerId: string): Promise<ProductWithSeller> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, quantity: true },
      });

      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw AppError.forbidden('You can only publish your own products', 'FORBIDDEN');
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
      throw AppError.internal('Failed to publish product', 'PRODUCT_PUBLISH_ERROR');
    }
  }

  async unpublishProduct(id: string, sellerId: string): Promise<ProductWithSeller> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true },
      });

      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw AppError.forbidden('You can only unpublish your own products', 'FORBIDDEN');
      }

      await this.prisma.product.update({
        where: { id },
        data: { status: ProductStatus.DRAFT },
      });

      return (await this.getProductById(id)) as ProductWithSeller;
    } catch (error) {
      this.logger.error(`Error unpublishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to unpublish product', 'PRODUCT_UNPUBLISH_ERROR');
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
    }
  }

  async getProductStats(sellerId: string): Promise<ProductStats> {
    try {
      const [totalStats, publishedCount, draftCount, outOfStockCount] = await Promise.all([
        this.prisma.product.aggregate({
          where: { sellerId, deletedAt: null },
          _count: { id: true },
          _sum: { viewCount: true, salesCount: true },
          _avg: { avgRating: true },
        }),
        this.prisma.product.count({
          where: { sellerId, status: ProductStatus.PUBLISHED, deletedAt: null },
        }),
        this.prisma.product.count({
          where: { sellerId, status: ProductStatus.DRAFT, deletedAt: null },
        }),
        this.prisma.product.count({
          where: { sellerId, status: ProductStatus.OUT_OF_STOCK, deletedAt: null },
        }),
      ]);

      return {
        totalProducts: totalStats._count.id || 0,
        publishedProducts: publishedCount,
        draftProducts: draftCount,
        outOfStockProducts: outOfStockCount,
        totalViews: totalStats._sum.viewCount || 0,
        totalSales: totalStats._sum.salesCount || 0,
        avgRating: totalStats._avg.avgRating || undefined,
      };
    } catch (error) {
      this.logger.error(`Error getting product stats: ${error}`);
      throw AppError.internal('Failed to get product stats', 'PRODUCT_STATS_ERROR');
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

  async generateVariantSku(productId: string, attributes: Record<string, any>): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    if (!product) {
      throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    const baseSku = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 10);

    const attrPart = Object.entries(attributes)
      .map(([key, value]) => `${key.substring(0, 3)}${String(value).substring(0, 3)}`)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    const sku = `${baseSku}-${attrPart}`;

    const existing = await this.prisma.productVariant.findUnique({
      where: { sku },
    });

    if (!existing) return sku;

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${sku}-${randomSuffix}`;
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
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      categories: product.categories?.map((c: any) => c.category) || [],
      variants:
        product.variants?.map((v: any) => ({
          ...v,
          price: Number(v.price),
          discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
        })) || [],
      priceHistory:
        product.priceHistory?.map((p: any) => ({
          ...p,
          price: Number(p.price),
        })) || [],
    };
  }
}

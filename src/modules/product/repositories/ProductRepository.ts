import { PrismaClient, Prisma, ProductStatus } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IProductRepository } from './ProductRepository.interface';
import {
  Product,
  ProductWithSeller,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
  ProductPaginationResult,
  PriceHistory,
  ProductStockUpdate,
  ProductInventoryCheck,
} from '../models/Product';
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

  async findByIdWithDetails(
    id: string,
    requestUserId?: string,
  ): Promise<ProductWithDetails | null> {
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
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          priceHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              changedByUser: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!product) return null;

      return this.transformProductWithDetails(product, requestUserId);
    } catch (error) {
      this.logger.error(`Error finding product by ID: ${error}`);
      return null;
    }
  }

  async findBySlugWithDetails(
    slug: string,
    requestUserId?: string,
  ): Promise<ProductWithDetails | null> {
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
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          priceHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!product) return null;

      return this.transformProductWithDetails(product, requestUserId);
    } catch (error) {
      this.logger.error(`Error finding product by slug: ${error}`);
      return null;
    }
  }

  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails> {
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
            sku: data.sku,
            weight: data.weight,
            dimensions: data.dimensions as any,
            status: data.status || ProductStatus.DRAFT,
            images: data.images,
            tags: data.tags || [],
            attributes: data.attributes as any,
            isCustomizable: data.isCustomizable || false,
            avgRating: null,
            reviewCount: 0,
            viewCount: 0,
            salesCount: 0,
          },
          include: {
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
        });

        // Link categories if provided
        if (data.categories && data.categories.length > 0) {
          await Promise.all(
            data.categories.map((categoryId) =>
              tx.categoryProduct.create({
                data: {
                  productId: product.id,
                  categoryId,
                },
              }),
            ),
          );
        }

        // Create initial price history entry
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            price: data.price,
            changeNote: 'Initial price',
            changedBy: sellerId,
          },
        });

        return product;
      });

      // Get full details
      const fullProduct = await this.findByIdWithDetails(product.id);
      if (!fullProduct) {
        throw new AppError('Failed to retrieve created product', 500, 'PRODUCT_CREATION_ERROR');
      }

      return fullProduct;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create product', 500, 'DATABASE_ERROR');
    }
  }

  async updateProduct(
    id: string,
    sellerId: string,
    data: UpdateProductDto,
  ): Promise<ProductWithDetails> {
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

      const product = await this.prisma.$transaction(async (tx) => {
        // Update categories if provided
        if (data.categories !== undefined) {
          await tx.categoryProduct.deleteMany({
            where: { productId: id },
          });

          if (data.categories.length > 0) {
            await Promise.all(
              data.categories.map((categoryId) =>
                tx.categoryProduct.create({
                  data: {
                    productId: id,
                    categoryId,
                  },
                }),
              ),
            );
          }
        }

        // Update product
        const updatedProduct = await tx.product.update({
          where: { id },
          data: updateData,
        });

        // Create price history entry if price changed
        if (data.price !== undefined && !existingProduct.price.equals(data.price)) {
          await tx.priceHistory.create({
            data: {
              productId: id,
              price: data.price,
              changeNote: 'Price updated',
              changedBy: sellerId,
            },
          });
        }

        return updatedProduct;
      });

      // Get full details
      const fullProduct = await this.findByIdWithDetails(id);
      if (!fullProduct) {
        throw new AppError('Failed to retrieve updated product', 500, 'PRODUCT_UPDATE_ERROR');
      }

      return fullProduct;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500, 'DATABASE_ERROR');
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
      throw new AppError('Failed to delete product', 500, 'DATABASE_ERROR');
    }
  }

  async getProducts(
    options: ProductQueryOptions,
    requestUserId?: string,
  ): Promise<ProductPaginationResult> {
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
        tags,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        inStock,
      } = options;

      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
      };

      // Basic filters
      if (sellerId) where.sellerId = sellerId;
      if (isCustomizable !== undefined) where.isCustomizable = isCustomizable;

      // Status filter
      if (status) {
        if (Array.isArray(status)) {
          where.status = { in: status };
        } else {
          where.status = status;
        }
      } else if (!sellerId) {
        // Default to published for public queries
        where.status = ProductStatus.PUBLISHED;
      }

      // Price range
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      // Stock filter
      if (inStock !== undefined) {
        where.quantity = inStock ? { gt: 0 } : { lte: 0 };
      }

      // Category filter
      if (categoryId) {
        where.categories = {
          some: { categoryId },
        };
      }

      // Tags filter
      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      // Search filter
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
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: products.map((product) => this.transformProductWithSeller(product, requestUserId)),
        meta: { total, page, limit, totalPages },
      };
    } catch (error) {
      this.logger.error(`Error getting products: ${error}`);
      throw new AppError('Failed to get products', 500, 'DATABASE_ERROR');
    }
  }

  async getMyProducts(
    sellerId: string,
    options: Omit<ProductQueryOptions, 'sellerId'> = {},
  ): Promise<ProductPaginationResult> {
    return this.getProducts({ ...options, sellerId });
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

    // Check uniqueness for this seller
    const existing = await this.prisma.product.findFirst({
      where: {
        slug: baseSlug,
        sellerId,
        deletedAt: null,
      },
    });

    if (!existing) return baseSlug;

    // Add random suffix if exists
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${randomStr}`;
  }

  async validateCategories(categoryIds: string[]): Promise<boolean> {
    try {
      const count = await this.prisma.category.count({
        where: {
          id: { in: categoryIds },
          isActive: true,
        },
      });
      return count === categoryIds.length;
    } catch (error) {
      return false;
    }
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

  async updatePrice(
    id: string,
    sellerId: string,
    data: PriceUpdateDto,
  ): Promise<ProductWithDetails> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, price: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
      }

      await this.prisma.$transaction(async (tx) => {
        // Update price
        await tx.product.update({
          where: { id },
          data: { price: data.price },
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
      });

      const updatedProduct = await this.findByIdWithDetails(id);
      if (!updatedProduct) {
        throw new AppError('Failed to retrieve updated product', 500, 'PRODUCT_UPDATE_ERROR');
      }

      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error updating product price: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product price', 500, 'DATABASE_ERROR');
    }
  }

  async getPriceHistory(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<PriceHistory>> {
    try {
      const total = await this.prisma.priceHistory.count({
        where: { productId },
      });

      const history = await this.prisma.priceHistory.findMany({
        where: { productId },
        include: {
          changedByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: history as any,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting price history: ${error}`);
      throw new AppError('Failed to get price history', 500, 'DATABASE_ERROR');
    }
  }

  // Helper methods for transforming data
  private transformProductWithSeller(product: any, requestUserId?: string): ProductWithSeller {
    return {
      ...product,
      dimensions: product.dimensions || null,
      attributes: product.attributes || null,
      categories: product.categories?.map((c: any) => c.category) || [],
    };
  }

  private transformProductWithDetails(product: any, requestUserId?: string): ProductWithDetails {
    return {
      ...this.transformProductWithSeller(product, requestUserId),
      categories: product.categories?.map((c: any) => c.category) || [],
      priceHistory: product.priceHistory || [],
      canEdit: requestUserId ? product.sellerId === requestUserId : false,
      canDelete: requestUserId ? product.sellerId === requestUserId : false,
    };
  }

  async searchProducts(
    query: string,
    options: ProductQueryOptions = {},
  ): Promise<ProductPaginationResult> {
    try {
      // Enhanced search with relevance scoring
      const searchOptions: ProductQueryOptions = {
        ...options,
        search: query,
      };

      // If no specific status provided, default to published for search
      if (!searchOptions.status && !searchOptions.sellerId) {
        searchOptions.status = ProductStatus.PUBLISHED;
      }

      return await this.getProducts(searchOptions);
    } catch (error) {
      this.logger.error(`Error searching products: ${error}`);
      throw new AppError('Failed to search products', 500, 'DATABASE_ERROR');
    }
  }

  async getProductsByCategory(
    categoryId: string,
    options: ProductQueryOptions = {},
  ): Promise<ProductPaginationResult> {
    try {
      // Get all child categories to include in search
      const childCategories = await this.getAllChildCategoryIds(categoryId);
      const allCategoryIds = [categoryId, ...childCategories];

      const {
        page = 1,
        limit = 10,
        search,
        minPrice,
        maxPrice,
        status = ProductStatus.PUBLISHED,
        isCustomizable,
        tags,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        inStock,
      } = options;

      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
        categories: {
          some: {
            categoryId: { in: allCategoryIds },
          },
        },
      };

      // Apply other filters
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      if (isCustomizable !== undefined) where.isCustomizable = isCustomizable;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (inStock !== undefined) {
        where.quantity = inStock ? { gt: 0 } : { lte: 0 };
      }

      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
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
                select: {
                  shopName: true,
                  isVerified: true,
                },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
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
      this.logger.error(`Error getting products by category: ${error}`);
      throw new AppError('Failed to get products by category', 500, 'DATABASE_ERROR');
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<ProductWithSeller[]> {
    try {
      // Featured products based on: high rating, high sales, verified sellers
      const products = await this.prisma.product.findMany({
        where: {
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
          quantity: { gt: 0 },
          OR: [
            { avgRating: { gte: 4.0 } },
            { salesCount: { gte: 10 } },
            { seller: { artisanProfile: { isVerified: true } } },
          ],
        },
        include: {
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
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [{ avgRating: 'desc' }, { salesCount: 'desc' }, { viewCount: 'desc' }],
        take: limit,
      });

      return products.map((product) => this.transformProductWithSeller(product));
    } catch (error) {
      this.logger.error(`Error getting featured products: ${error}`);
      throw new AppError('Failed to get featured products', 500, 'DATABASE_ERROR');
    }
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<ProductWithSeller[]> {
    try {
      // Get the source product's categories and tags
      const sourceProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: {
            select: { categoryId: true },
          },
        },
      });

      if (!sourceProduct) {
        return [];
      }

      const categoryIds = sourceProduct.categories.map((c) => c.categoryId);
      const tags = sourceProduct.tags;

      // Find related products with scoring
      const relatedProducts = await this.prisma.product.findMany({
        where: {
          id: { not: productId },
          sellerId: { not: sourceProduct.sellerId }, // Different seller
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
          quantity: { gt: 0 },
          OR: [
            // Same categories
            categoryIds.length > 0
              ? {
                  categories: {
                    some: {
                      categoryId: { in: categoryIds },
                    },
                  },
                }
              : {},
            // Similar tags
            tags.length > 0
              ? {
                  tags: { hasSome: tags },
                }
              : {},
            // Similar price range (±20%)
            {
              price: {
                gte: sourceProduct.price * 0.8,
                lte: sourceProduct.price * 1.2,
              },
            },
          ].filter((condition) => Object.keys(condition).length > 0),
        },
        include: {
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
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [{ avgRating: 'desc' }, { salesCount: 'desc' }],
        take: limit * 2, // Get more to filter and sort by relevance
      });

      // Simple relevance scoring and return top matches
      const scoredProducts = relatedProducts.map((product) => {
        let score = 0;

        // Category match score
        const productCategories = product.categories.map((c) => c.category.id);
        const categoryMatches = categoryIds.filter((id) => productCategories.includes(id)).length;
        score += categoryMatches * 3;

        // Tag match score
        const tagMatches = product.tags.filter((tag) => tags.includes(tag)).length;
        score += tagMatches * 2;

        // Price similarity score
        const priceDiff = Math.abs(product.price - sourceProduct.price) / sourceProduct.price;
        if (priceDiff < 0.2) score += 1;

        return { product, score };
      });

      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => this.transformProductWithSeller(item.product));
    } catch (error) {
      this.logger.error(`Error getting related products: ${error}`);
      return []; // Return empty array on error for related products
    }
  }

  async updateStock(updates: ProductStockUpdate[]): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const update of updates) {
          const { productId, quantity, operation } = update;

          let updateData: any;

          switch (operation) {
            case 'increment':
              updateData = { quantity: { increment: quantity } };
              break;
            case 'decrement':
              // Ensure we don't go below 0
              const currentProduct = await tx.product.findUnique({
                where: { id: productId },
                select: { quantity: true },
              });

              if (!currentProduct) {
                throw new AppError(`Product ${productId} not found`, 404, 'PRODUCT_NOT_FOUND');
              }

              const newQuantity = Math.max(0, currentProduct.quantity - quantity);
              updateData = { quantity: newQuantity };
              break;
            case 'set':
              updateData = { quantity: Math.max(0, quantity) };
              break;
            default:
              throw new AppError(`Invalid operation: ${operation}`, 400, 'INVALID_OPERATION');
          }

          await tx.product.update({
            where: { id: productId },
            data: updateData,
          });

          // Update status based on new quantity
          const updatedProduct = await tx.product.findUnique({
            where: { id: productId },
            select: { quantity: true, status: true },
          });

          if (updatedProduct) {
            if (
              updatedProduct.quantity === 0 &&
              updatedProduct.status === ProductStatus.PUBLISHED
            ) {
              await tx.product.update({
                where: { id: productId },
                data: { status: ProductStatus.OUT_OF_STOCK },
              });
            } else if (
              updatedProduct.quantity > 0 &&
              updatedProduct.status === ProductStatus.OUT_OF_STOCK
            ) {
              await tx.product.update({
                where: { id: productId },
                data: { status: ProductStatus.PUBLISHED },
              });
            }
          }
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Error updating stock: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update stock', 500, 'DATABASE_ERROR');
    }
  }

  async checkInventory(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<ProductInventoryCheck[]> {
    try {
      const results: ProductInventoryCheck[] = [];

      for (const item of items) {
        const product = await this.prisma.product.findUnique({
          where: {
            id: item.productId,
            deletedAt: null,
          },
          select: {
            id: true,
            quantity: true,
            status: true,
          },
        });

        if (!product) {
          results.push({
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            inStock: false,
          });
          continue;
        }

        const isAvailable =
          product.status === ProductStatus.PUBLISHED && product.quantity >= item.quantity;

        results.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: product.quantity,
          inStock: isAvailable,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(`Error checking inventory: ${error}`);
      throw new AppError('Failed to check inventory', 500, 'DATABASE_ERROR');
    }
  }

  async getLowStockProducts(sellerId: string, threshold: number = 5): Promise<ProductWithSeller[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          sellerId,
          deletedAt: null,
          status: { not: ProductStatus.DELETED },
          quantity: { lte: threshold },
        },
        include: {
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
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [{ quantity: 'asc' }, { createdAt: 'desc' }],
      });

      return products.map((product) => this.transformProductWithSeller(product));
    } catch (error) {
      this.logger.error(`Error getting low stock products: ${error}`);
      throw new AppError('Failed to get low stock products', 500, 'DATABASE_ERROR');
    }
  }

  async publishProduct(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: {
          sellerId: true,
          status: true,
          name: true,
          price: true,
          images: true,
          quantity: true,
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only publish your own products', 403, 'FORBIDDEN');
      }

      // Validation for publishing
      if (!product.name || product.name.trim().length < 3) {
        throw new AppError(
          'Product name must be at least 3 characters',
          400,
          'INVALID_PRODUCT_DATA',
        );
      }

      if (product.price <= 0) {
        throw new AppError('Product price must be greater than 0', 400, 'INVALID_PRODUCT_DATA');
      }

      if (!product.images || product.images.length === 0) {
        throw new AppError('Product must have at least one image', 400, 'INVALID_PRODUCT_DATA');
      }

      if (product.status === ProductStatus.PUBLISHED) {
        throw new AppError('Product is already published', 400, 'INVALID_OPERATION');
      }

      // Determine final status based on quantity
      const finalStatus =
        product.quantity > 0 ? ProductStatus.PUBLISHED : ProductStatus.OUT_OF_STOCK;

      const updatedProduct = await this.updateProduct(id, sellerId, { status: finalStatus });
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error publishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish product', 500, 'DATABASE_ERROR');
    }
  }

  async unpublishProduct(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, status: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only unpublish your own products', 403, 'FORBIDDEN');
      }

      if (product.status === ProductStatus.DRAFT) {
        throw new AppError('Product is already unpublished', 400, 'INVALID_OPERATION');
      }

      const updatedProduct = await this.updateProduct(id, sellerId, {
        status: ProductStatus.DRAFT,
      });
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error unpublishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to unpublish product', 500, 'DATABASE_ERROR');
    }
  }

  async markOutOfStock(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, status: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only modify your own products', 403, 'FORBIDDEN');
      }

      const updatedProduct = await this.updateProduct(id, sellerId, {
        status: ProductStatus.OUT_OF_STOCK,
        quantity: 0,
      });
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error marking product out of stock: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark product out of stock', 500, 'DATABASE_ERROR');
    }
  }

  async markInStock(id: string, sellerId: string, quantity?: number): Promise<ProductWithDetails> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id, deletedAt: null },
        select: { sellerId: true, status: true, quantity: true },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.sellerId !== sellerId) {
        throw new AppError('You can only modify your own products', 403, 'FORBIDDEN');
      }

      const updateData: any = { status: ProductStatus.PUBLISHED };

      // Set quantity if provided, otherwise ensure it's at least 1
      if (quantity !== undefined) {
        updateData.quantity = Math.max(1, quantity);
      } else if (product.quantity <= 0) {
        updateData.quantity = 1;
      }

      const updatedProduct = await this.updateProduct(id, sellerId, updateData);
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error marking product in stock: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark product in stock', 500, 'DATABASE_ERROR');
    }
  }

  async updateSalesCount(productId: string, quantity: number): Promise<void> {
    try {
      await this.prisma.product.update({
        where: { id: productId },
        data: { salesCount: { increment: quantity } },
      });
    } catch (error) {
      this.logger.error(`Error updating sales count: ${error}`);
      // Don't throw for analytics updates
    }
  }

  async getProductStats(sellerId: string): Promise<{
    totalProducts: number;
    publishedProducts: number;
    outOfStockProducts: number;
    totalViews: number;
    totalSales: number;
  }> {
    try {
      const [totalStats, publishedCount, outOfStockCount] = await Promise.all([
        this.prisma.product.aggregate({
          where: { sellerId, deletedAt: null },
          _count: { id: true },
          _sum: { viewCount: true, salesCount: true },
        }),
        this.prisma.product.count({
          where: {
            sellerId,
            status: ProductStatus.PUBLISHED,
            deletedAt: null,
          },
        }),
        this.prisma.product.count({
          where: {
            sellerId,
            status: ProductStatus.OUT_OF_STOCK,
            deletedAt: null,
          },
        }),
      ]);

      return {
        totalProducts: totalStats._count.id || 0,
        publishedProducts: publishedCount,
        outOfStockProducts: outOfStockCount,
        totalViews: totalStats._sum.viewCount || 0,
        totalSales: totalStats._sum.salesCount || 0,
      };
    } catch (error) {
      this.logger.error(`Error getting product stats: ${error}`);
      throw new AppError('Failed to get product stats', 500, 'DATABASE_ERROR');
    }
  }

  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      // Use raw SQL for tag aggregation since Prisma doesn't support array aggregation well
      const result = await this.prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT 
        unnest(tags) as tag, 
        COUNT(*) as count
      FROM "Product" 
      WHERE "deletedAt" IS NULL 
        AND status = 'PUBLISHED'
        AND array_length(tags, 1) > 0
      GROUP BY unnest(tags)
      ORDER BY count DESC
      LIMIT ${limit}
    `;

      return result.map((item) => ({
        tag: item.tag,
        count: Number(item.count),
      }));
    } catch (error) {
      this.logger.error(`Error getting popular tags: ${error}`);
      // Fallback to basic implementation
      const products = await this.prisma.product.findMany({
        where: {
          status: ProductStatus.PUBLISHED,
          deletedAt: null,
        },
        select: { tags: true },
      });

      const tagCounts = new Map<string, number>();
      products.forEach((product) => {
        product.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }
  }

  async getProductsByTag(
    tag: string,
    options: ProductQueryOptions = {},
  ): Promise<ProductPaginationResult> {
    return this.getProducts({
      ...options,
      tags: [tag],
      status: options.status || ProductStatus.PUBLISHED,
    });
  }

  async getProductsByIds(productIds: string[]): Promise<ProductWithSeller[]> {
    try {
      if (productIds.length === 0) return [];

      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null,
        },
        include: {
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
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return products.map((product) => this.transformProductWithSeller(product));
    } catch (error) {
      this.logger.error(`Error getting products by IDs: ${error}`);
      throw new AppError('Failed to get products by IDs', 500, 'DATABASE_ERROR');
    }
  }

  // Helper method to get child category IDs
  private async getAllChildCategoryIds(categoryId: string): Promise<string[]> {
    try {
      const childCategories = await this.prisma.category.findMany({
        where: { parentId: categoryId, isActive: true },
        select: { id: true },
      });

      if (childCategories.length === 0) {
        return [];
      }

      const childIds = childCategories.map((c) => c.id);
      const deepChildIds = await Promise.all(childIds.map((id) => this.getAllChildCategoryIds(id)));

      return [...childIds, ...deepChildIds.flat()];
    } catch (error) {
      this.logger.error(`Error getting child category IDs: ${error}`);
      return [];
    }
  }
}

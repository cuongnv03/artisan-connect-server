import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICategoryRepository } from './CategoryRepository.interface';
import {
  Category,
  CategoryWithChildren,
  CategoryWithParent,
  CategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryOptions,
  CategoryProductsResult,
} from '../models/Category';
import { ProductPaginationResult } from '../models/Product';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class CategoryRepository
  extends BasePrismaRepository<Category, string>
  implements ICategoryRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'category');
  }

  async findByIdWithOptions(
    id: string,
    options?: CategoryQueryOptions,
  ): Promise<Category | CategoryWithChildren | CategoryWithParent | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          parent: options?.includeParent ? true : undefined,
          children: options?.includeChildren
            ? {
                where: options?.includeInactive ? undefined : { isActive: true },
                orderBy: { sortOrder: 'asc' },
              }
            : undefined,
          _count: options?.includeProductCount
            ? {
                select: { products: true },
              }
            : undefined,
        },
      });

      if (!category) return null;

      return this.transformCategoryWithOptions(category, options);
    } catch (error) {
      this.logger.error(`Error finding category by ID: ${error}`);
      return null;
    }
  }

  async findBySlugWithOptions(
    slug: string,
    options?: CategoryQueryOptions,
  ): Promise<Category | CategoryWithChildren | CategoryWithParent | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },
        include: {
          parent: options?.includeParent ? true : undefined,
          children: options?.includeChildren
            ? {
                where: options?.includeInactive ? undefined : { isActive: true },
                orderBy: { sortOrder: 'asc' },
              }
            : undefined,
          _count: options?.includeProductCount
            ? {
                select: { products: true },
              }
            : undefined,
        },
      });

      if (!category) return null;

      return this.transformCategoryWithOptions(category, options);
    } catch (error) {
      this.logger.error(`Error finding category by slug: ${error}`);
      return null;
    }
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      // Check if name is unique
      const isNameUnique = await this.isCategoryNameUnique(data.name);
      if (!isNameUnique) {
        throw new AppError('Category name already exists', 409, 'CATEGORY_NAME_EXISTS');
      }

      // Validate parent category if provided
      if (data.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: data.parentId, isActive: true },
        });

        if (!parentCategory) {
          throw new AppError(
            'Parent category not found or inactive',
            404,
            'PARENT_CATEGORY_NOT_FOUND',
          );
        }
      }

      // Generate unique slug
      const slug = await this.generateSlug(data.name);

      // Determine level
      const level = data.parentId
        ? (
            await this.prisma.category.findUnique({
              where: { id: data.parentId },
              select: { level: true },
            })
          )?.level! + 1
        : 0;

      // Get next sort order for the parent
      const maxSortOrder = await this.prisma.category.aggregate({
        where: { parentId: data.parentId },
        _max: { sortOrder: true },
      });

      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          level,
          sortOrder: data.sortOrder || (maxSortOrder._max.sortOrder || 0) + 1,
          isActive: true,
        },
      });

      return category as Category;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create category', 500, 'DATABASE_ERROR');
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Check name uniqueness if name is being changed
      if (data.name && data.name !== existingCategory.name) {
        const isNameUnique = await this.isCategoryNameUnique(data.name, id);
        if (!isNameUnique) {
          throw new AppError('Category name already exists', 409, 'CATEGORY_NAME_EXISTS');
        }
      }

      // Validate parent change
      if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
        if (data.parentId === id) {
          throw new AppError('Category cannot be its own parent', 400, 'INVALID_PARENT');
        }

        if (data.parentId) {
          const parentCategory = await this.prisma.category.findUnique({
            where: { id: data.parentId, isActive: true },
          });

          if (!parentCategory) {
            throw new AppError(
              'Parent category not found or inactive',
              404,
              'PARENT_CATEGORY_NOT_FOUND',
            );
          }

          // Validate hierarchy to prevent cycles
          const isValidHierarchy = await this.validateCategoryHierarchy(id, data.parentId);
          if (!isValidHierarchy) {
            throw new AppError(
              'Invalid category hierarchy - would create cycle',
              400,
              'INVALID_HIERARCHY',
            );
          }
        }
      }

      const updateData: any = { ...data };

      // Generate new slug if name changed
      if (data.name && data.name !== existingCategory.name) {
        updateData.slug = await this.generateSlug(data.name);
      }

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
      });

      // Update levels if parent changed
      if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
        await this.updateCategoryLevel(id);
      }

      return category as Category;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500, 'DATABASE_ERROR');
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          children: true,
          _count: { select: { products: true } },
        },
      });

      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Check if category has child categories
      if (category.children.length > 0) {
        throw new AppError(
          'Cannot delete category with subcategories',
          400,
          'CATEGORY_HAS_CHILDREN',
        );
      }

      // Check if category has products
      if (category._count.products > 0) {
        throw new AppError('Cannot delete category with products', 400, 'CATEGORY_HAS_PRODUCTS');
      }

      await this.prisma.category.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete category', 500, 'DATABASE_ERROR');
    }
  }

  async getAllCategories(options?: CategoryQueryOptions): Promise<Category[]> {
    try {
      const where: Prisma.CategoryWhereInput = {};

      if (!options?.includeInactive) {
        where.isActive = true;
      }

      if (options?.level !== undefined) {
        where.level = options.level;
      }

      if (options?.parentId !== undefined) {
        where.parentId = options.parentId;
      }

      const categories = await this.prisma.category.findMany({
        where,
        include: {
          parent: options?.includeParent ? true : undefined,
          children: options?.includeChildren
            ? {
                where: options?.includeInactive ? undefined : { isActive: true },
                orderBy: { sortOrder: 'asc' },
              }
            : undefined,
          _count: options?.includeProductCount
            ? {
                select: { products: true },
              }
            : undefined,
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories.map((category) =>
        this.transformCategoryWithOptions(category, options),
      ) as Category[];
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      throw new AppError('Failed to get categories', 500, 'DATABASE_ERROR');
    }
  }

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    try {
      // Get all active categories
      const allCategories = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { products: true } },
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      });

      // Build tree structure
      const categoryMap = new Map<string, CategoryTreeNode>();
      const rootCategories: CategoryTreeNode[] = [];

      // First pass: create all nodes
      allCategories.forEach((category) => {
        const treeNode: CategoryTreeNode = {
          ...category,
          children: [],
          productCount: category._count.products,
          depth: category.level,
        };
        categoryMap.set(category.id, treeNode);
      });

      // Second pass: build tree structure
      allCategories.forEach((category) => {
        const treeNode = categoryMap.get(category.id)!;

        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(treeNode);
          }
        } else {
          rootCategories.push(treeNode);
        }
      });

      return rootCategories;
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      throw new AppError('Failed to get category tree', 500, 'DATABASE_ERROR');
    }
  }

  async getRootCategories(options?: CategoryQueryOptions): Promise<CategoryWithChildren[]> {
    const categories = await this.getAllCategories({
      ...options,
      parentId: null,
      includeChildren: true,
    });
    return categories as CategoryWithChildren[];
  }

  async getChildCategories(parentId: string, options?: CategoryQueryOptions): Promise<Category[]> {
    return this.getAllCategories({
      ...options,
      parentId,
    });
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    try {
      const path: Category[] = [];
      let currentId: string | null = categoryId;

      while (currentId) {
        const category = await this.prisma.category.findUnique({
          where: { id: currentId },
        });

        if (!category) break;

        path.unshift(category as Category);
        currentId = category.parentId;
      }

      return path;
    } catch (error) {
      this.logger.error(`Error getting category path: ${error}`);
      return [];
    }
  }

  async getProductsByCategory(
    categoryId: string,
    options: any = {},
  ): Promise<CategoryProductsResult> {
    try {
      // Get category with parent info
      const category = (await this.findByIdWithOptions(categoryId, {
        includeParent: true,
        includeProductCount: true,
      })) as CategoryWithParent;

      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Get all child category IDs
      const childCategoryIds = await this.getAllChildCategoryIds(categoryId);
      const allCategoryIds = [categoryId, ...childCategoryIds];

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...otherFilters
      } = options;

      // Get products from this category and all child categories
      const where: Prisma.ProductWhereInput = {
        categories: {
          some: {
            categoryId: { in: allCategoryIds },
          },
        },
        status: 'PUBLISHED',
        deletedAt: null,
        ...otherFilters,
      };

      const total = await this.prisma.product.count({ where });

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

      const productResult: ProductPaginationResult = {
        data: products.map((product) => ({
          ...product,
          categories: product.categories.map((c) => c.category),
        })) as any,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      return {
        category,
        products: productResult,
      };
    } catch (error) {
      this.logger.error(`Error getting products by category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by category', 500, 'DATABASE_ERROR');
    }
  }

  async getCategoriesWithProductCount(): Promise<CategoryWithChildren[]> {
    return this.getAllCategories({
      includeProductCount: true,
      includeChildren: true,
    }) as Promise<CategoryWithChildren[]>;
  }

  async getAllChildCategoryIds(categoryId: string): Promise<string[]> {
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

  async validateCategoryHierarchy(categoryId: string, newParentId: string): Promise<boolean> {
    try {
      // Check if newParentId is a descendant of categoryId
      let currentId = newParentId;

      while (currentId) {
        if (currentId === categoryId) {
          return false; // Would create a cycle
        }

        const parent = await this.prisma.category.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

        if (!parent || !parent.parentId) {
          break;
        }

        currentId = parent.parentId;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating category hierarchy: ${error}`);
      return false;
    }
  }

  async isCategoryNameUnique(name: string, excludeId?: string): Promise<boolean> {
    try {
      const where: Prisma.CategoryWhereInput = {
        name: { equals: name, mode: 'insensitive' },
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const existing = await this.prisma.category.findFirst({ where });
      return !existing;
    } catch (error) {
      this.logger.error(`Error checking category name uniqueness: ${error}`);
      return false;
    }
  }

  async generateSlug(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (baseSlug.length < 2) {
      baseSlug = `category-${baseSlug}`;
    }

    const existing = await this.prisma.category.findUnique({
      where: { slug: baseSlug },
    });

    if (!existing) return baseSlug;

    // Add random suffix if exists
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomStr}`;
  }

  async updateCategoryLevel(categoryId: string): Promise<void> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { parentId: true },
      });

      if (!category) return;

      const level = category.parentId
        ? (
            await this.prisma.category.findUnique({
              where: { id: category.parentId },
              select: { level: true },
            })
          )?.level! + 1
        : 0;

      await this.prisma.category.update({
        where: { id: categoryId },
        data: { level },
      });

      // Update levels of all children recursively
      const children = await this.prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });

      for (const child of children) {
        await this.updateCategoryLevel(child.id);
      }
    } catch (error) {
      this.logger.error(`Error updating category level: ${error}`);
    }
  }

  async reorderCategories(
    categoryOrders: Array<{ id: string; sortOrder: number }>,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(
        categoryOrders.map(({ id, sortOrder }) =>
          this.prisma.category.update({
            where: { id },
            data: { sortOrder },
          }),
        ),
      );

      return true;
    } catch (error) {
      this.logger.error(`Error reordering categories: ${error}`);
      return false;
    }
  }

  async moveCategory(categoryId: string, newParentId: string | null): Promise<Category> {
    try {
      // Validate the move
      if (newParentId) {
        const isValid = await this.validateCategoryHierarchy(categoryId, newParentId);
        if (!isValid) {
          throw new AppError(
            'Invalid category move - would create cycle',
            400,
            'INVALID_HIERARCHY',
          );
        }
      }

      const category = await this.prisma.category.update({
        where: { id: categoryId },
        data: { parentId: newParentId },
      });

      // Update levels
      await this.updateCategoryLevel(categoryId);

      return category as Category;
    } catch (error) {
      this.logger.error(`Error moving category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to move category', 500, 'DATABASE_ERROR');
    }
  }

  async mergeCategoriesProducts(fromCategoryId: string, toCategoryId: string): Promise<boolean> {
    try {
      // Move all products from source category to target category
      const productCategories = await this.prisma.categoryProduct.findMany({
        where: { categoryId: fromCategoryId },
      });

      await this.prisma.$transaction([
        // Remove products from source category
        this.prisma.categoryProduct.deleteMany({
          where: { categoryId: fromCategoryId },
        }),
        // Add products to target category (ignore duplicates)
        ...productCategories.map((pc) =>
          this.prisma.categoryProduct.upsert({
            where: {
              categoryId_productId: {
                categoryId: toCategoryId,
                productId: pc.productId,
              },
            },
            create: {
              categoryId: toCategoryId,
              productId: pc.productId,
            },
            update: {},
          }),
        ),
      ]);

      return true;
    } catch (error) {
      this.logger.error(`Error merging categories: ${error}`);
      return false;
    }
  }

  // Helper method to transform category with options
  private transformCategoryWithOptions(
    category: any,
    options?: CategoryQueryOptions,
  ): Category | CategoryWithChildren | CategoryWithParent {
    const base = {
      ...category,
      productCount: category._count?.products,
    };

    // Remove Prisma-specific fields
    delete base._count;

    return base;
  }
}

import { PrismaClient, Category as PrismaCategory, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICategoryRepository } from './CategoryRepository.interface';
import {
  Category,
  CategoryWithChildren,
  CategoryWithParent,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryOptions,
} from '../models/Category';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
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

  /**
   * Find category by ID with options
   */
  async findByIdWithOptions(
    id: string,
    options?: CategoryQueryOptions,
  ): Promise<Category | CategoryWithChildren | CategoryWithParent | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          parent: options?.includeParent ? true : undefined,
          children: options?.includeChildren ? true : undefined,
          _count: options?.includeStat
            ? {
                select: {
                  products: true,
                  children: true,
                },
              }
            : undefined,
        },
      });

      return category as unknown as CategoryWithChildren | CategoryWithParent | null;
    } catch (error) {
      this.logger.error(`Error finding category by ID: ${error}`);
      return null;
    }
  }

  /**
   * Create category
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      // Check if name already exists
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingCategory) {
        throw new AppError('Category name already exists', 409, 'CATEGORY_EXISTS');
      }

      // Check if parent category exists
      if (data.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parentCategory) {
          throw new AppError('Parent category not found', 404, 'PARENT_NOT_FOUND');
        }
      }

      // Generate slug from name
      const slug = this.generateSlug(data.name);

      // Create new category
      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          level: data.parentId ? 1 : 0, // Set level based on parent
        },
      });

      return category as Category;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create category', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      // Check if category exists
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Check for name uniqueness if changing name
      if (data.name && data.name !== category.name) {
        const existingCategory = await this.prisma.category.findFirst({
          where: {
            name: {
              equals: data.name,
              mode: 'insensitive',
            },
            id: {
              not: id,
            },
          },
        });

        if (existingCategory) {
          throw new AppError('Category name already exists', 409, 'CATEGORY_EXISTS');
        }
      }

      // Check parent category and validate hierarchy
      if (data.parentId && data.parentId !== category.parentId) {
        // Don't allow self as parent
        if (data.parentId === id) {
          throw new AppError('Category cannot be its own parent', 400, 'INVALID_PARENT');
        }

        const parentCategory = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parentCategory) {
          throw new AppError('Parent category not found', 404, 'PARENT_NOT_FOUND');
        }

        // Validate hierarchy to prevent cycles
        const isHierarchyValid = await this.validateCategoryHierarchy(id, data.parentId);
        if (!isHierarchyValid) {
          throw new AppError('Invalid category hierarchy', 400, 'INVALID_HIERARCHY');
        }
      }

      // Generate new slug if name changed
      const slug = data.name ? this.generateSlug(data.name) : undefined;

      // Update category
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
        },
      });

      return updatedCategory as Category;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      // Check if category exists
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          children: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Check for child categories
      if (category.children.length > 0) {
        throw new AppError('Cannot delete category with sub-categories', 400, 'HAS_CHILDREN');
      }

      // Check for associated products
      if (category._count.products > 0) {
        throw new AppError('Cannot delete category with products', 400, 'HAS_PRODUCTS');
      }

      // Delete category
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

  /**
   * Get all categories
   */
  async getAllCategories(options?: CategoryQueryOptions): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        include: {
          parent: options?.includeParent
            ? {
                select: {
                  id: true,
                  name: true,
                },
              }
            : undefined,
          _count: options?.includeStat
            ? {
                select: {
                  products: true,
                  children: true,
                },
              }
            : undefined,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return categories as unknown as Category[];
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      throw new AppError('Failed to get categories', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get category tree
   */
  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    try {
      // Get all categories
      const allCategories = await this.prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Build tree structure from flat list
      const rootCategories = allCategories.filter((c) => !c.parentId);
      const categoryMap = new Map();

      // Initialize with empty children arrays
      allCategories.forEach((c) => {
        categoryMap.set(c.id, { ...c, children: [] });
      });

      // Populate children
      allCategories.forEach((category) => {
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent && parent.children) {
            parent.children.push(categoryMap.get(category.id));
          }
        }
      });

      // Return root categories with their nested children
      return rootCategories.map(
        (c) => categoryMap.get(c.id) || c,
      ) as unknown as CategoryWithChildren[];
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      throw new AppError('Failed to get category tree', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<any>> {
    try {
      // Check if category exists
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Get all child categories
      const childCategoryIds = await this.getAllChildCategoryIds(categoryId);
      const allCategoryIds = [categoryId, ...childCategoryIds];

      // Count total products in these categories
      const total = await this.prisma.product.count({
        where: {
          categories: {
            some: {
              categoryId: {
                in: allCategoryIds,
              },
            },
          },
          status: 'PUBLISHED',
          deletedAt: null,
        },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get products
      const products = await this.prisma.product.findMany({
        where: {
          categories: {
            some: {
              categoryId: {
                in: allCategoryIds,
              },
            },
          },
          status: 'PUBLISHED',
          deletedAt: null,
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
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Create custom result with category info
      const result: PaginatedResult<any> = {
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages,
          categoryInfo: category,
        },
      };

      return result;
    } catch (error) {
      this.logger.error(`Error getting products by category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by category', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get all child category IDs
   */
  async getAllChildCategoryIds(categoryId: string): Promise<string[]> {
    try {
      const childCategories = await this.prisma.category.findMany({
        where: {
          parentId: categoryId,
        },
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

  /**
   * Validate category hierarchy (prevent cycles)
   */
  async validateCategoryHierarchy(categoryId: string, newParentId: string): Promise<boolean> {
    try {
      // Check if categoryId is an ancestor of newParentId
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

  /**
   * Helper method to generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}

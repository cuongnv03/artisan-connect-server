import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICategoryRepository } from './CategoryRepository.interface';
import {
  Category,
  CategoryWithChildren,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../models/Category';
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

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      // Check if name is unique
      const existing = await this.prisma.category.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' } },
      });

      if (existing) {
        throw new AppError('Category name already exists', 409, 'CATEGORY_NAME_EXISTS');
      }

      // Validate parent category if provided
      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId, isActive: true },
        });

        if (!parent) {
          throw new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
        }
      }

      const slug = await this.generateSlug(data.name);

      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          isActive: true,
        },
      });

      return category as Category;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create category', 500, 'CATEGORY_CREATE_ERROR');
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const existing = await this.prisma.category.findUnique({ where: { id } });

      if (!existing) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Check name uniqueness if name is being changed
      if (data.name && data.name !== existing.name) {
        const nameExists = await this.prisma.category.findFirst({
          where: {
            name: { equals: data.name, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (nameExists) {
          throw new AppError('Category name already exists', 409, 'CATEGORY_NAME_EXISTS');
        }
      }

      const updateData: any = { ...data };

      // Generate new slug if name changed
      if (data.name && data.name !== existing.name) {
        updateData.slug = await this.generateSlug(data.name);
      }

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
      });

      return category as Category;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500, 'CATEGORY_UPDATE_ERROR');
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

      if (category.children.length > 0) {
        throw new AppError(
          'Cannot delete category with subcategories',
          400,
          'CATEGORY_HAS_CHILDREN',
        );
      }

      if (category._count.products > 0) {
        throw new AppError('Cannot delete category with products', 400, 'CATEGORY_HAS_PRODUCTS');
      }

      await this.prisma.category.delete({ where: { id } });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete category', 500, 'CATEGORY_DELETE_ERROR');
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      return categories as Category[];
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      throw new AppError('Failed to get categories', 500, 'CATEGORY_GET_ERROR');
    }
  }

  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    try {
      const allCategories = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
      });

      // Build tree structure
      const categoryMap = new Map<string, CategoryWithChildren>();
      const rootCategories: CategoryWithChildren[] = [];

      // First pass: create all nodes
      allCategories.forEach((category) => {
        const treeNode: CategoryWithChildren = {
          ...category,
          children: [],
          productCount: category._count.products,
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
      throw new AppError('Failed to get category tree', 500, 'CATEGORY_TREE_ERROR');
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug, isActive: true },
      });

      return category as Category | null;
    } catch (error) {
      this.logger.error(`Error getting category by slug: ${error}`);
      return null;
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

    const randomStr = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomStr}`;
  }

  async getCategoryAttributeTemplates(categoryId: string): Promise<any[]> {
    try {
      const templates = await this.prisma.categoryAttributeTemplate.findMany({
        where: { categoryId },
        orderBy: { sortOrder: 'asc' },
      });
      return templates;
    } catch (error) {
      this.logger.error(`Error getting category attribute templates: ${error}`);
      throw AppError.internal('Failed to get category attribute templates', 'DATABASE_ERROR');
    }
  }

  async createCategoryAttributeTemplate(categoryId: string, data: any): Promise<any> {
    try {
      const template = await this.prisma.categoryAttributeTemplate.create({
        data: {
          categoryId,
          ...data,
        },
      });
      return template;
    } catch (error) {
      this.logger.error(`Error creating category attribute template: ${error}`);
      throw AppError.internal('Failed to create category attribute template', 'DATABASE_ERROR');
    }
  }
}

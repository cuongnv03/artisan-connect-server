import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICategoryRepository } from './CategoryRepository.interface';
import {
  Category,
  CategoryWithRelations,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryAttributeTemplate,
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
        throw AppError.conflict('Category name already exists', 'CATEGORY_NAME_EXISTS');
      }

      // Validate parent category if provided
      let level = 0;
      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId, isActive: true },
          select: { level: true },
        });

        if (!parent) {
          throw AppError.notFound('Parent category not found', 'PARENT_CATEGORY_NOT_FOUND');
        }

        level = parent.level + 1;
      }

      const slug = await this.generateSlug(data.name);

      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          level,
          sortOrder: data.sortOrder || 0,
          isActive: true,
        },
      });

      return category as Category;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create category', 'CATEGORY_CREATE_ERROR');
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const existing = await this.prisma.category.findUnique({
        where: { id },
        select: { id: true, name: true, parentId: true, level: true },
      });

      if (!existing) {
        throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
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
          throw AppError.conflict('Category name already exists', 'CATEGORY_NAME_EXISTS');
        }
      }

      const updateData: any = { ...data };

      // Generate new slug if name changed
      if (data.name && data.name !== existing.name) {
        updateData.slug = await this.generateSlug(data.name);
      }

      // Update level if parent changed
      if (data.parentId !== undefined && data.parentId !== existing.parentId) {
        if (data.parentId) {
          const parent = await this.prisma.category.findUnique({
            where: { id: data.parentId },
            select: { level: true },
          });

          if (!parent) {
            throw AppError.notFound('Parent category not found', 'PARENT_CATEGORY_NOT_FOUND');
          }

          updateData.level = parent.level + 1;
        } else {
          updateData.level = 0;
        }

        // Update all children levels recursively
        await this.updateChildrenLevels(id, updateData.level);
      }

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
      });

      return category as Category;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update category', 'CATEGORY_UPDATE_ERROR');
    }
  }

  private async updateChildrenLevels(parentId: string, parentLevel: number): Promise<void> {
    const children = await this.prisma.category.findMany({
      where: { parentId },
      select: { id: true },
    });

    for (const child of children) {
      await this.prisma.category.update({
        where: { id: child.id },
        data: { level: parentLevel + 1 },
      });

      // Recursively update grandchildren
      await this.updateChildrenLevels(child.id, parentLevel + 1);
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          children: true,
          products: true,
        },
      });

      if (!category) {
        throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
      }

      if (category.children.length > 0) {
        throw AppError.badRequest(
          'Cannot delete category with subcategories',
          'CATEGORY_HAS_CHILDREN',
        );
      }

      if (category.products.length > 0) {
        throw AppError.badRequest('Cannot delete category with products', 'CATEGORY_HAS_PRODUCTS');
      }

      await this.prisma.category.delete({ where: { id } });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete category', 'CATEGORY_DELETE_ERROR');
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      });

      return categories as Category[];
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      throw AppError.internal('Failed to get categories', 'CATEGORY_GET_ERROR');
    }
  }

  async getCategoryTree(): Promise<CategoryWithRelations[]> {
    try {
      const allCategories = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          // SỬA ĐÂY - Chỉ đếm published products
          _count: {
            select: {
              products: {
                where: {
                  product: {
                    status: { in: ['PUBLISHED', 'OUT_OF_STOCK'] },
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      });

      // Build tree structure
      const categoryMap = new Map<string, CategoryWithRelations>();
      const rootCategories: CategoryWithRelations[] = [];

      // First pass: create all nodes
      allCategories.forEach((category) => {
        const treeNode: CategoryWithRelations = {
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
            parent.children!.push(treeNode);
          }
        } else {
          rootCategories.push(treeNode);
        }
      });

      return rootCategories;
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      throw AppError.internal('Failed to get category tree', 'CATEGORY_TREE_ERROR');
    }
  }

  async getCategoryBySlug(slug: string): Promise<CategoryWithRelations | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug, isActive: true },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
          // SỬA ĐÂY
          _count: {
            select: {
              products: {
                where: {
                  product: {
                    status: { in: ['PUBLISHED', 'OUT_OF_STOCK'] },
                    deletedAt: null,
                  },
                },
              },
            },
          },
          attributeTemplates: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!category) return null;

      return {
        ...category,
        productCount: category._count.products,
      } as CategoryWithRelations;
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

  async getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]> {
    try {
      const templates = await this.prisma.categoryAttributeTemplate.findMany({
        where: { categoryId },
        orderBy: { sortOrder: 'asc' },
      });
      return templates as CategoryAttributeTemplate[];
    } catch (error) {
      this.logger.error(`Error getting category attribute templates: ${error}`);
      throw AppError.internal('Failed to get category attribute templates', 'DATABASE_ERROR');
    }
  }

  async createCategoryAttributeTemplate(
    categoryId: string,
    data: Partial<CategoryAttributeTemplate>,
  ): Promise<CategoryAttributeTemplate> {
    try {
      const template = await this.prisma.categoryAttributeTemplate.create({
        data: {
          categoryId,
          name: data.name!,
          key: data.key!,
          type: data.type!,
          isRequired: data.isRequired || false,
          isVariant: data.isVariant || false,
          options: data.options,
          unit: data.unit,
          sortOrder: data.sortOrder || 0,
          description: data.description,
          isCustom: data.isCustom || false,
          createdBy: data.createdBy,
        },
      });
      return template as CategoryAttributeTemplate;
    } catch (error) {
      this.logger.error(`Error creating category attribute template: ${error}`);
      throw AppError.internal('Failed to create category attribute template', 'DATABASE_ERROR');
    }
  }
}

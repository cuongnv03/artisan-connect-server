import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IProductAttributeRepository } from './ProductAttributeRepository.interface';
import {
  ProductAttribute,
  CategoryAttributeTemplate,
  ProductVariant,
  CustomAttributeTemplate,
  CreateCategoryAttributeTemplateDto,
  UpdateCategoryAttributeTemplateDto,
  CreateProductAttributeDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  CreateCustomAttributeTemplateDto,
  AttributeType,
} from '../models/ProductAttribute';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class ProductAttributeRepository
  extends BasePrismaRepository<ProductAttribute, string>
  implements IProductAttributeRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'productAttribute');
  }

  async createCategoryAttributeTemplate(
    categoryId: string,
    data: CreateCategoryAttributeTemplateDto & { key: string },
  ): Promise<CategoryAttributeTemplate> {
    try {
      const template = await this.prisma.categoryAttributeTemplate.create({
        data: {
          categoryId,
          ...data,
        },
      });

      return template as CategoryAttributeTemplate;
    } catch (error) {
      this.logger.error(`Error creating category attribute template: ${error}`);
      throw new AppError(
        'Failed to create category attribute template',
        500,
        'TEMPLATE_CREATE_ERROR',
      );
    }
  }

  async updateCategoryAttributeTemplate(
    id: string,
    data: UpdateCategoryAttributeTemplateDto,
  ): Promise<CategoryAttributeTemplate> {
    try {
      const template = await this.prisma.categoryAttributeTemplate.update({
        where: { id },
        data,
      });

      return template as CategoryAttributeTemplate;
    } catch (error) {
      this.logger.error(`Error updating category attribute template: ${error}`);
      throw new AppError(
        'Failed to update category attribute template',
        500,
        'TEMPLATE_UPDATE_ERROR',
      );
    }
  }

  async deleteCategoryAttributeTemplate(id: string): Promise<boolean> {
    try {
      await this.prisma.categoryAttributeTemplate.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting category attribute template: ${error}`);
      throw new AppError(
        'Failed to delete category attribute template',
        500,
        'TEMPLATE_DELETE_ERROR',
      );
    }
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
      throw new AppError('Failed to get category attribute templates', 500, 'TEMPLATE_GET_ERROR');
    }
  }

  async getCategoryAttributeTemplateByKey(
    categoryId: string,
    key: string,
  ): Promise<CategoryAttributeTemplate | null> {
    try {
      const template = await this.prisma.categoryAttributeTemplate.findUnique({
        where: { categoryId_key: { categoryId, key } },
      });

      return template as CategoryAttributeTemplate | null;
    } catch (error) {
      this.logger.error(`Error getting category attribute template by key: ${error}`);
      return null;
    }
  }

  async setProductAttributes(
    productId: string,
    attributes: CreateProductAttributeDto[],
  ): Promise<ProductAttribute[]> {
    try {
      // Get product with categories to fetch templates
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: {
            include: {
              category: {
                include: {
                  attributeTemplates: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Get all attribute templates for the product's categories
      const templates = product.categories.flatMap((cp) => cp.category.attributeTemplates);

      return await this.prisma.$transaction(async (tx) => {
        // Delete existing attributes
        await tx.productAttribute.deleteMany({
          where: { productId },
        });

        // Create new attributes
        const createdAttributes = [];
        for (const attr of attributes) {
          const template = templates.find((t) => t.key === attr.key);
          if (!template) {
            throw new AppError(`Invalid attribute key: ${attr.key}`, 400, 'INVALID_ATTRIBUTE_KEY');
          }

          const created = await tx.productAttribute.create({
            data: {
              productId,
              key: attr.key,
              name: template.name,
              value: attr.value,
              type: template.type,
              unit: attr.unit || template.unit,
            },
          });

          createdAttributes.push(created);
        }

        return createdAttributes as ProductAttribute[];
      });
    } catch (error) {
      this.logger.error(`Error setting product attributes: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to set product attributes', 500, 'ATTRIBUTE_SET_ERROR');
    }
  }

  async getProductAttributes(productId: string): Promise<ProductAttribute[]> {
    try {
      const attributes = await this.prisma.productAttribute.findMany({
        where: { productId },
        orderBy: { name: 'asc' },
      });

      return attributes as ProductAttribute[];
    } catch (error) {
      this.logger.error(`Error getting product attributes: ${error}`);
      throw new AppError('Failed to get product attributes', 500, 'ATTRIBUTE_GET_ERROR');
    }
  }

  async deleteProductAttribute(productId: string, key: string): Promise<boolean> {
    try {
      await this.prisma.productAttribute.delete({
        where: { productId_key: { productId, key } },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting product attribute: ${error}`);
      throw new AppError('Failed to delete product attribute', 500, 'ATTRIBUTE_DELETE_ERROR');
    }
  }

  async createProductVariant(
    productId: string,
    data: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    try {
      const sku = await this.generateSku(productId, data.attributes);

      return await this.prisma.$transaction(async (tx) => {
        const variant = await tx.productVariant.create({
          data: {
            productId,
            sku,
            name: data.name,
            price: data.price || 0,
            discountPrice: data.discountPrice,
            quantity: data.quantity,
            images: data.images || [],
            weight: data.weight,
            dimensions: data.dimensions,
          },
        });

        // Create variant attributes
        const variantAttributes = [];
        for (const attr of data.attributes) {
          const created = await tx.productVariantAttribute.create({
            data: {
              variantId: variant.id,
              key: attr.key,
              name: attr.key, // Will be updated with proper name from template
              value: attr.value,
            },
          });
          variantAttributes.push(created);
        }

        // Update product hasVariants flag
        await tx.product.update({
          where: { id: productId },
          data: { hasVariants: true },
        });

        return {
          ...variant,
          attributes: variantAttributes,
        } as ProductVariant;
      });
    } catch (error) {
      this.logger.error(`Error creating product variant: ${error}`);
      throw new AppError('Failed to create product variant', 500, 'VARIANT_CREATE_ERROR');
    }
  }

  async updateProductVariant(id: string, data: UpdateProductVariantDto): Promise<ProductVariant> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updateData: any = { ...data };
        delete updateData.attributes;

        const variant = await tx.productVariant.update({
          where: { id },
          data: updateData,
        });

        // Update attributes if provided
        if (data.attributes) {
          await tx.productVariantAttribute.deleteMany({
            where: { variantId: id },
          });

          const variantAttributes = [];
          for (const attr of data.attributes) {
            const created = await tx.productVariantAttribute.create({
              data: {
                variantId: id,
                key: attr.key,
                name: attr.key,
                value: attr.value,
              },
            });
            variantAttributes.push(created);
          }

          return {
            ...variant,
            attributes: variantAttributes,
          } as ProductVariant;
        }

        // Get existing attributes
        const attributes = await tx.productVariantAttribute.findMany({
          where: { variantId: id },
        });

        return {
          ...variant,
          attributes,
        } as ProductVariant;
      });
    } catch (error) {
      this.logger.error(`Error updating product variant: ${error}`);
      throw new AppError('Failed to update product variant', 500, 'VARIANT_UPDATE_ERROR');
    }
  }

  async deleteProductVariant(id: string): Promise<boolean> {
    try {
      await this.prisma.productVariant.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting product variant: ${error}`);
      throw new AppError('Failed to delete product variant', 500, 'VARIANT_DELETE_ERROR');
    }
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const variants = await this.prisma.productVariant.findMany({
        where: { productId },
        include: {
          attributes: true,
        },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
      });

      return variants.map((v) => ({
        ...v,
        price: Number(v.price),
        discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
      })) as ProductVariant[];
    } catch (error) {
      this.logger.error(`Error getting product variants: ${error}`);
      throw new AppError('Failed to get product variants', 500, 'VARIANT_GET_ERROR');
    }
  }

  async getProductVariantById(id: string): Promise<ProductVariant | null> {
    try {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id },
        include: {
          attributes: true,
        },
      });

      if (!variant) return null;

      return {
        ...variant,
        price: Number(variant.price),
        discountPrice: variant.discountPrice ? Number(variant.discountPrice) : undefined,
      } as ProductVariant;
    } catch (error) {
      this.logger.error(`Error getting product variant by ID: ${error}`);
      return null;
    }
  }

  async getProductVariantBySku(sku: string): Promise<ProductVariant | null> {
    try {
      const variant = await this.prisma.productVariant.findUnique({
        where: { sku },
        include: {
          attributes: true,
        },
      });

      if (!variant) return null;

      return {
        ...variant,
        price: Number(variant.price),
        discountPrice: variant.discountPrice ? Number(variant.discountPrice) : undefined,
      } as ProductVariant;
    } catch (error) {
      this.logger.error(`Error getting product variant by SKU: ${error}`);
      return null;
    }
  }

  async createCustomAttributeTemplate(
    artisanId: string,
    data: CreateCustomAttributeTemplateDto & { key: string },
  ): Promise<CustomAttributeTemplate> {
    try {
      const template = await this.prisma.customAttributeTemplate.create({
        data: {
          artisanId,
          ...data,
        },
      });

      return template as CustomAttributeTemplate;
    } catch (error) {
      this.logger.error(`Error creating custom attribute template: ${error}`);
      throw new AppError(
        'Failed to create custom attribute template',
        500,
        'CUSTOM_TEMPLATE_CREATE_ERROR',
      );
    }
  }

  async getCustomAttributeTemplates(artisanId: string): Promise<CustomAttributeTemplate[]> {
    try {
      const templates = await this.prisma.customAttributeTemplate.findMany({
        where: { artisanId, isActive: true },
        orderBy: { name: 'asc' },
      });

      return templates as CustomAttributeTemplate[];
    } catch (error) {
      this.logger.error(`Error getting custom attribute templates: ${error}`);
      throw new AppError(
        'Failed to get custom attribute templates',
        500,
        'CUSTOM_TEMPLATE_GET_ERROR',
      );
    }
  }

  async deleteCustomAttributeTemplate(id: string): Promise<boolean> {
    try {
      await this.prisma.customAttributeTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting custom attribute template: ${error}`);
      throw new AppError(
        'Failed to delete custom attribute template',
        500,
        'CUSTOM_TEMPLATE_DELETE_ERROR',
      );
    }
  }

  async generateSku(
    productId: string,
    attributes: { key: string; value: string }[],
  ): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Generate base SKU from product name
    const baseSku = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 10);

    // Add variant attributes
    const variantPart = attributes
      .map((attr) => `${attr.key.substring(0, 3)}${attr.value.substring(0, 3)}`)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    const sku = `${baseSku}-${variantPart}`;

    // Check uniqueness
    const existing = await this.prisma.productVariant.findUnique({
      where: { sku },
    });

    if (!existing) return sku;

    // Add random suffix if not unique
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${sku}-${randomSuffix}`;
  }

  async checkAttributeKeyExists(categoryId: string, key: string): Promise<boolean> {
    try {
      const existing = await this.prisma.categoryAttributeTemplate.findUnique({
        where: { categoryId_key: { categoryId, key } },
      });
      return !!existing;
    } catch (error) {
      return false;
    }
  }

  async checkCustomAttributeKeyExists(artisanId: string, key: string): Promise<boolean> {
    try {
      const existing = await this.prisma.customAttributeTemplate.findUnique({
        where: { artisanId_key: { artisanId, key } },
      });
      return !!existing;
    } catch (error) {
      return false;
    }
  }
}

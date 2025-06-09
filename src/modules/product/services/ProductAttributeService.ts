import { IProductAttributeService } from './ProductAttributeService.interface';
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
import { IProductAttributeRepository } from '../repositories/ProductAttributeRepository.interface';
import { IProductRepository } from '../repositories/ProductRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { BaseService } from '../../../shared/baseClasses/BaseService';
import container from '../../../core/di/container';

export class ProductAttributeService extends BaseService implements IProductAttributeService {
  private attributeRepository: IProductAttributeRepository;
  private productRepository: IProductRepository;

  constructor() {
    super();
    this.attributeRepository = container.resolve<IProductAttributeRepository>(
      'productAttributeRepository',
    );
    this.productRepository = container.resolve<IProductRepository>('productRepository');
  }

  async createCategoryAttributeTemplate(
    categoryId: string,
    data: CreateCategoryAttributeTemplateDto,
  ): Promise<CategoryAttributeTemplate> {
    try {
      const key = this.generateAttributeKey(data.name);

      // Check if key already exists
      const exists = await this.attributeRepository.checkAttributeKeyExists(categoryId, key);
      if (exists) {
        throw AppError.conflict('Attribute key already exists for this category');
      }

      // Validate options for SELECT types
      if ([AttributeType.SELECT, AttributeType.MULTI_SELECT].includes(data.type)) {
        if (!data.options || data.options.length === 0) {
          throw AppError.badRequest('Options are required for SELECT type attributes');
        }
      }

      const template = await this.attributeRepository.createCategoryAttributeTemplate(categoryId, {
        ...data,
        key,
      });

      this.logger.info(`Category attribute template created: ${template.id} - ${template.name}`);
      return template;
    } catch (error) {
      this.handleError(error, 'Failed to create category attribute template');
    }
  }

  async updateCategoryAttributeTemplate(
    id: string,
    data: UpdateCategoryAttributeTemplateDto,
  ): Promise<CategoryAttributeTemplate> {
    try {
      // Validate options for SELECT types if type is being changed
      if (data.type && [AttributeType.SELECT, AttributeType.MULTI_SELECT].includes(data.type)) {
        if (!data.options || data.options.length === 0) {
          throw AppError.badRequest('Options are required for SELECT type attributes');
        }
      }

      const template = await this.attributeRepository.updateCategoryAttributeTemplate(id, data);

      this.logger.info(`Category attribute template updated: ${id}`);
      return template;
    } catch (error) {
      this.handleError(error, 'Failed to update category attribute template');
    }
  }

  async deleteCategoryAttributeTemplate(id: string): Promise<boolean> {
    try {
      const result = await this.attributeRepository.deleteCategoryAttributeTemplate(id);

      if (result) {
        this.logger.info(`Category attribute template deleted: ${id}`);
      }

      return result;
    } catch (error) {
      this.handleError(error, 'Failed to delete category attribute template');
    }
  }

  async getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]> {
    try {
      return await this.attributeRepository.getCategoryAttributeTemplates(categoryId);
    } catch (error) {
      this.handleError(error, 'Failed to get category attribute templates');
    }
  }

  async setProductAttributes(
    productId: string,
    sellerId: string,
    attributes: CreateProductAttributeDto[],
  ): Promise<ProductAttribute[]> {
    try {
      // Validate product ownership
      const isOwner = await this.productRepository.isProductOwner(productId, sellerId);
      if (!isOwner) {
        throw AppError.forbidden('You can only set attributes for your own products');
      }

      // Validate attributes
      await this.validateProductAttributes(productId, attributes);

      const savedAttributes = await this.attributeRepository.setProductAttributes(
        productId,
        attributes,
      );

      this.logger.info(`Product attributes set: ${productId} - ${attributes.length} attributes`);
      return savedAttributes;
    } catch (error) {
      this.handleError(error, 'Failed to set product attributes');
    }
  }

  async getProductAttributes(productId: string): Promise<ProductAttribute[]> {
    try {
      return await this.attributeRepository.getProductAttributes(productId);
    } catch (error) {
      this.handleError(error, 'Failed to get product attributes');
    }
  }

  async createProductVariant(
    productId: string,
    sellerId: string,
    data: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    try {
      // Validate product ownership
      const isOwner = await this.productRepository.isProductOwner(productId, sellerId);
      if (!isOwner) {
        throw AppError.forbidden('You can only create variants for your own products');
      }

      // Validate variant data
      this.validateVariantData(data);

      // Get product to check base price
      const product = await this.productRepository.getProductById(productId);
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      // Use product price if variant price not provided
      if (data.price === undefined) {
        data.price = product.price;
      }

      const variant = await this.attributeRepository.createProductVariant(productId, data);

      this.logger.info(`Product variant created: ${variant.id} - ${variant.sku}`);
      return variant;
    } catch (error) {
      this.handleError(error, 'Failed to create product variant');
    }
  }

  async updateProductVariant(
    id: string,
    sellerId: string,
    data: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    try {
      // Get variant to check product ownership
      const variant = await this.attributeRepository.getProductVariantById(id);
      if (!variant) {
        throw AppError.notFound('Product variant not found');
      }

      const isOwner = await this.productRepository.isProductOwner(variant.productId, sellerId);
      if (!isOwner) {
        throw AppError.forbidden('You can only update variants for your own products');
      }

      if (data.attributes) {
        this.validateVariantAttributes(data.attributes);
      }

      const updatedVariant = await this.attributeRepository.updateProductVariant(id, data);

      this.logger.info(`Product variant updated: ${id}`);
      return updatedVariant;
    } catch (error) {
      this.handleError(error, 'Failed to update product variant');
    }
  }

  async deleteProductVariant(id: string, sellerId: string): Promise<boolean> {
    try {
      // Get variant to check product ownership
      const variant = await this.attributeRepository.getProductVariantById(id);
      if (!variant) {
        throw AppError.notFound('Product variant not found');
      }

      const isOwner = await this.productRepository.isProductOwner(variant.productId, sellerId);
      if (!isOwner) {
        throw AppError.forbidden('You can only delete variants for your own products');
      }

      const result = await this.attributeRepository.deleteProductVariant(id);

      if (result) {
        this.logger.info(`Product variant deleted: ${id}`);
      }

      return result;
    } catch (error) {
      this.handleError(error, 'Failed to delete product variant');
    }
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      return await this.attributeRepository.getProductVariants(productId);
    } catch (error) {
      this.handleError(error, 'Failed to get product variants');
    }
  }

  async getProductVariantById(id: string): Promise<ProductVariant | null> {
    try {
      return await this.attributeRepository.getProductVariantById(id);
    } catch (error) {
      this.logger.error(`Error getting product variant by ID: ${error}`);
      return null;
    }
  }

  async createCustomAttributeTemplate(
    artisanId: string,
    data: CreateCustomAttributeTemplateDto,
  ): Promise<CustomAttributeTemplate> {
    try {
      const key = this.generateAttributeKey(data.name);

      const exists = await this.attributeRepository.checkCustomAttributeKeyExists(artisanId, key);
      if (exists) {
        throw AppError.conflict('Custom attribute key already exists');
      }

      if ([AttributeType.SELECT, AttributeType.MULTI_SELECT].includes(data.type)) {
        if (!data.options || data.options.length === 0) {
          throw AppError.badRequest('Options are required for SELECT type attributes');
        }
      }

      const template = await this.attributeRepository.createCustomAttributeTemplate(artisanId, {
        ...data,
        key,
      });

      this.logger.info(`Custom attribute template created: ${template.id} - ${template.name}`);
      return template;
    } catch (error) {
      this.handleError(error, 'Failed to create custom attribute template');
    }
  }

  async getCustomAttributeTemplates(artisanId: string): Promise<CustomAttributeTemplate[]> {
    try {
      return await this.attributeRepository.getCustomAttributeTemplates(artisanId);
    } catch (error) {
      this.handleError(error, 'Failed to get custom attribute templates');
    }
  }

  async deleteCustomAttributeTemplate(id: string, artisanId: string): Promise<boolean> {
    try {
      // In a real implementation, you'd check ownership here
      const result = await this.attributeRepository.deleteCustomAttributeTemplate(id);

      if (result) {
        this.logger.info(`Custom attribute template deleted: ${id}`);
      }

      return result;
    } catch (error) {
      this.handleError(error, 'Failed to delete custom attribute template');
    }
  }

  async generateVariantsFromAttributes(
    productId: string,
    sellerId: string,
  ): Promise<ProductVariant[]> {
    try {
      // Validate product ownership
      const isOwner = await this.productRepository.isProductOwner(productId, sellerId);
      if (!isOwner) {
        throw AppError.forbidden('You can only generate variants for your own products');
      }

      // Get product attributes
      const attributes = await this.attributeRepository.getProductAttributes(productId);

      // Get category attribute templates to find variant attributes
      const product = await this.productRepository.getProductById(productId);
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      // Get variant attributes (isVariant = true)
      const variantAttributeKeys = await this.getVariantAttributeKeys(productId);
      const variantAttributes = attributes.filter((attr) =>
        variantAttributeKeys.includes(attr.key),
      );

      if (variantAttributes.length === 0) {
        throw AppError.badRequest('No variant attributes found');
      }

      // Generate combinations
      const combinations = this.generateAttributeCombinations(variantAttributes);

      // Create variants
      const createdVariants = [];
      for (const combination of combinations) {
        try {
          const variantData: CreateProductVariantDto = {
            quantity: product.quantity,
            price: product.price,
            attributes: combination,
          };

          const variant = await this.attributeRepository.createProductVariant(
            productId,
            variantData,
          );
          createdVariants.push(variant);
        } catch (error) {
          this.logger.warn(
            `Failed to create variant for combination: ${JSON.stringify(combination)}`,
          );
        }
      }

      this.logger.info(`Generated ${createdVariants.length} variants for product ${productId}`);
      return createdVariants;
    } catch (error) {
      this.handleError(error, 'Failed to generate variants from attributes');
    }
  }

  // Private helper methods
  private generateAttributeKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private async validateProductAttributes(
    productId: string,
    attributes: CreateProductAttributeDto[],
  ): Promise<void> {
    // Get product to find categories
    const product = await this.productRepository.getProductById(productId);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Validate each attribute has proper structure
    for (const attr of attributes) {
      if (!attr.key || !attr.value) {
        throw AppError.badRequest('Attribute key and value are required');
      }
    }

    // Additional validation can be added here
  }

  private validateVariantData(data: CreateProductVariantDto): void {
    if (data.quantity < 0) {
      throw AppError.badRequest('Quantity cannot be negative');
    }

    if (data.price !== undefined && data.price <= 0) {
      throw AppError.badRequest('Price must be greater than 0');
    }

    if (data.discountPrice !== undefined) {
      if (data.discountPrice <= 0) {
        throw AppError.badRequest('Discount price must be greater than 0');
      }
      if (data.price !== undefined && data.discountPrice >= data.price) {
        throw AppError.badRequest('Discount price must be less than regular price');
      }
    }

    this.validateVariantAttributes(data.attributes);
  }

  private validateVariantAttributes(attributes: { key: string; value: string }[]): void {
    if (!attributes || attributes.length === 0) {
      throw AppError.badRequest('Variant attributes are required');
    }

    for (const attr of attributes) {
      if (!attr.key || !attr.value) {
        throw AppError.badRequest('Attribute key and value are required');
      }
    }
  }

  private async getVariantAttributeKeys(productId: string): Promise<string[]> {
    // This would get the variant attribute keys from category templates
    // For simplicity, returning common variant attributes
    return ['size', 'color', 'material'];
  }

  private generateAttributeCombinations(
    attributes: ProductAttribute[],
  ): Array<{ key: string; value: string }[]> {
    // Group attributes by key
    const groups = this.groupAttributesByKey(attributes);

    // Generate cartesian product
    return this.cartesianProduct(groups);
  }

  private groupAttributesByKey(attributes: ProductAttribute[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    for (const attr of attributes) {
      if (!groups[attr.key]) {
        groups[attr.key] = [];
      }
      if (!groups[attr.key].includes(attr.value)) {
        groups[attr.key].push(attr.value);
      }
    }

    return groups;
  }

  private cartesianProduct(
    groups: Record<string, string[]>,
  ): Array<{ key: string; value: string }[]> {
    const keys = Object.keys(groups);
    const values = keys.map((key) => groups[key]);

    const combinations: Array<{ key: string; value: string }[]> = [];

    const generate = (current: { key: string; value: string }[], index: number) => {
      if (index === keys.length) {
        combinations.push([...current]);
        return;
      }

      for (const value of values[index]) {
        current.push({ key: keys[index], value });
        generate(current, index + 1);
        current.pop();
      }
    };

    generate([], 0);
    return combinations;
  }
}

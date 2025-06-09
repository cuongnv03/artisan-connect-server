import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
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
} from '../models/ProductAttribute';

export interface IProductAttributeRepository extends BaseRepository<ProductAttribute, string> {
  // Category Attribute Templates
  createCategoryAttributeTemplate(
    categoryId: string,
    data: CreateCategoryAttributeTemplateDto & { key: string },
  ): Promise<CategoryAttributeTemplate>;

  updateCategoryAttributeTemplate(
    id: string,
    data: UpdateCategoryAttributeTemplateDto,
  ): Promise<CategoryAttributeTemplate>;

  deleteCategoryAttributeTemplate(id: string): Promise<boolean>;

  getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]>;

  getCategoryAttributeTemplateByKey(
    categoryId: string,
    key: string,
  ): Promise<CategoryAttributeTemplate | null>;

  // Product Attributes
  setProductAttributes(
    productId: string,
    attributes: CreateProductAttributeDto[],
  ): Promise<ProductAttribute[]>;

  getProductAttributes(productId: string): Promise<ProductAttribute[]>;

  deleteProductAttribute(productId: string, key: string): Promise<boolean>;

  // Product Variants
  createProductVariant(productId: string, data: CreateProductVariantDto): Promise<ProductVariant>;

  updateProductVariant(id: string, data: UpdateProductVariantDto): Promise<ProductVariant>;

  deleteProductVariant(id: string): Promise<boolean>;

  getProductVariants(productId: string): Promise<ProductVariant[]>;

  getProductVariantById(id: string): Promise<ProductVariant | null>;

  getProductVariantBySku(sku: string): Promise<ProductVariant | null>;

  // Custom Attribute Templates
  createCustomAttributeTemplate(
    artisanId: string,
    data: CreateCustomAttributeTemplateDto & { key: string },
  ): Promise<CustomAttributeTemplate>;

  getCustomAttributeTemplates(artisanId: string): Promise<CustomAttributeTemplate[]>;

  deleteCustomAttributeTemplate(id: string): Promise<boolean>;

  // Utilities
  generateSku(productId: string, attributes: { key: string; value: string }[]): Promise<string>;
  checkAttributeKeyExists(categoryId: string, key: string): Promise<boolean>;
  checkCustomAttributeKeyExists(artisanId: string, key: string): Promise<boolean>;
}

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

export interface IProductAttributeService {
  // Category Attribute Templates
  createCategoryAttributeTemplate(
    categoryId: string,
    data: CreateCategoryAttributeTemplateDto,
  ): Promise<CategoryAttributeTemplate>;

  updateCategoryAttributeTemplate(
    id: string,
    data: UpdateCategoryAttributeTemplateDto,
  ): Promise<CategoryAttributeTemplate>;

  deleteCategoryAttributeTemplate(id: string): Promise<boolean>;

  getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]>;

  // Product Attributes
  setProductAttributes(
    productId: string,
    sellerId: string,
    attributes: CreateProductAttributeDto[],
  ): Promise<ProductAttribute[]>;

  getProductAttributes(productId: string): Promise<ProductAttribute[]>;

  // Product Variants
  createProductVariant(
    productId: string,
    sellerId: string,
    data: CreateProductVariantDto,
  ): Promise<ProductVariant>;

  updateProductVariant(
    id: string,
    sellerId: string,
    data: UpdateProductVariantDto,
  ): Promise<ProductVariant>;

  deleteProductVariant(id: string, sellerId: string): Promise<boolean>;

  getProductVariants(productId: string): Promise<ProductVariant[]>;

  getProductVariantById(id: string): Promise<ProductVariant | null>;

  // Custom Attribute Templates
  createCustomAttributeTemplate(
    artisanId: string,
    data: CreateCustomAttributeTemplateDto,
  ): Promise<CustomAttributeTemplate>;

  getCustomAttributeTemplates(artisanId: string): Promise<CustomAttributeTemplate[]>;

  deleteCustomAttributeTemplate(id: string, artisanId: string): Promise<boolean>;

  // Auto-generate variants from attributes
  generateVariantsFromAttributes(productId: string, sellerId: string): Promise<ProductVariant[]>;
}

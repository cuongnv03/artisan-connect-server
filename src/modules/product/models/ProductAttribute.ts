export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  URL = 'URL',
  EMAIL = 'EMAIL',
}

export interface ProductAttribute {
  id: string;
  productId: string;
  key: string;
  name: string;
  value: string;
  type: AttributeType;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryAttributeTemplate {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: AttributeType;
  isRequired: boolean;
  isVariant: boolean;
  options?: string[];
  unit?: string;
  sortOrder: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  images: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  attributes: ProductVariantAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantAttribute {
  id: string;
  variantId: string;
  key: string;
  name: string;
  value: string;
}

export interface CustomAttributeTemplate {
  id: string;
  artisanId: string;
  name: string;
  key: string;
  type: AttributeType;
  options?: string[];
  unit?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateCategoryAttributeTemplateDto {
  name: string;
  type: AttributeType;
  isRequired?: boolean;
  isVariant?: boolean;
  options?: string[];
  unit?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryAttributeTemplateDto {
  name?: string;
  type?: AttributeType;
  isRequired?: boolean;
  isVariant?: boolean;
  options?: string[];
  unit?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateProductAttributeDto {
  key: string;
  value: string;
  unit?: string;
}

export interface CreateProductVariantDto {
  name?: string;
  price?: number;
  discountPrice?: number;
  quantity: number;
  images?: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  attributes: { key: string; value: string }[];
}

export interface UpdateProductVariantDto {
  name?: string;
  price?: number;
  discountPrice?: number;
  quantity?: number;
  images?: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  attributes?: { key: string; value: string }[];
}

export interface CreateCustomAttributeTemplateDto {
  name: string;
  type: AttributeType;
  options?: string[];
  unit?: string;
  description?: string;
}

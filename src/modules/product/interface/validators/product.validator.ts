import Joi from 'joi';
import { ProductStatus } from '../../models/ProductEnums';

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(3).max(200),
  description: Joi.string().max(2000).allow(''),
  price: Joi.number().positive().required(),
  discountPrice: Joi.number().positive().allow(null).less(Joi.ref('price')),
  quantity: Joi.number().integer().min(0).required(),
  minOrderQty: Joi.number().integer().min(1).default(1),
  maxOrderQty: Joi.number().integer().min(Joi.ref('minOrderQty')).allow(null),
  sku: Joi.string().max(100).allow(''),
  barcode: Joi.string().max(100).allow(''),
  weight: Joi.number().positive().allow(null),
  dimensions: Joi.object().allow(null),
  isCustomizable: Joi.boolean().default(false),
  allowNegotiation: Joi.boolean().default(true),
  shippingInfo: Joi.object().allow(null),
  categoryIds: Joi.array().items(Joi.string().uuid()).max(5).required(),
  images: Joi.array().items(Joi.string().uri()).min(1).max(10).required(),
  featuredImage: Joi.string().uri().allow(''),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  seoTitle: Joi.string().max(60).allow(''),
  seoDescription: Joi.string().max(160).allow(''),
  attributes: Joi.object().allow(null),
  specifications: Joi.object().allow(null),
  customFields: Joi.object().allow(null),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().max(200).allow(''),
      price: Joi.number().positive(),
      discountPrice: Joi.number().positive(),
      quantity: Joi.number().integer().min(0).required(),
      images: Joi.array().items(Joi.string().uri()).max(10),
      weight: Joi.number().positive(),
      dimensions: Joi.object(),
      attributes: Joi.object().required(),
      isActive: Joi.boolean().default(true),
      isDefault: Joi.boolean().default(false),
      sortOrder: Joi.number().integer().min(0),
    }),
  ),
});

export const updateProductSchema = createProductSchema
  .fork(['name', 'price', 'quantity', 'categoryIds', 'images'], (schema) => schema.optional())
  .append({
    status: Joi.string().valid(...Object.values(ProductStatus)),
  });

export const updatePriceSchema = Joi.object({
  price: Joi.number().positive().required(),
  note: Joi.string().max(100),
});

export const getProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sellerId: Joi.string().uuid(),
  categoryIds: Joi.alternatives().try(Joi.string().uuid(), Joi.array().items(Joi.string().uuid())),
  search: Joi.string().max(100).allow(''),
  status: Joi.string().valid(...Object.values(ProductStatus)),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'price', 'name', 'viewCount', 'salesCount', 'avgRating')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  inStock: Joi.boolean(),
  hasVariants: Joi.boolean(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(Joi.ref('minPrice')),
});

export const searchProductsQuerySchema = Joi.object({
  q: Joi.string().required().min(2).max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  categoryIds: Joi.alternatives().try(Joi.string().uuid(), Joi.array().items(Joi.string().uuid())),
  sortBy: Joi.string().valid('createdAt', 'price', 'name', 'viewCount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

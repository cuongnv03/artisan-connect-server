import Joi from 'joi';
import { ProductStatus } from '../../models/ProductEnums';

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(3).max(200).messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 200 characters',
  }),
  description: Joi.string().max(2000).allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters',
  }),
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be greater than 0',
    'any.required': 'Price is required',
  }),
  discountPrice: Joi.number().positive().allow(null).less(Joi.ref('price')).messages({
    'number.positive': 'Discount price must be greater than 0',
    'number.less': 'Discount price must be less than regular price',
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Quantity cannot be negative',
    'any.required': 'Quantity is required',
  }),
  minOrderQty: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Minimum order quantity must be at least 1',
  }),
  maxOrderQty: Joi.number().integer().min(Joi.ref('minOrderQty')).allow(null).messages({
    'number.min': 'Maximum order quantity must be greater than or equal to minimum order quantity',
  }),
  sku: Joi.string().max(100).allow('').messages({
    'string.max': 'SKU cannot exceed 100 characters',
  }),
  barcode: Joi.string().max(100).allow('').messages({
    'string.max': 'Barcode cannot exceed 100 characters',
  }),
  weight: Joi.number().positive().allow(null).messages({
    'number.positive': 'Weight must be positive',
  }),
  dimensions: Joi.object().allow(null),
  allowNegotiation: Joi.boolean().default(true),
  shippingInfo: Joi.object().allow(null),
  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .default(ProductStatus.DRAFT), // ✅ THÊM: status validation
  categoryIds: Joi.array().items(Joi.string().uuid()).min(1).max(5).required().messages({
    'array.min': 'At least one category is required',
    'array.max': 'Maximum 5 categories allowed',
    'any.required': 'Categories are required',
  }),
  images: Joi.array().items(Joi.string().uri()).min(1).max(10).required().messages({
    'array.min': 'At least one image is required',
    'array.max': 'Maximum 10 images allowed',
    'any.required': 'Images are required',
  }),
  featuredImage: Joi.string().uri().allow('').messages({
    'string.uri': 'Featured image must be a valid URL',
  }),
  tags: Joi.array().items(Joi.string().max(30)).max(10).default([]).messages({
    'array.max': 'Maximum 10 tags allowed',
    'string.max': 'Each tag cannot exceed 30 characters',
  }),
  seoTitle: Joi.string().max(60).allow('').messages({
    'string.max': 'SEO title cannot exceed 60 characters',
  }),
  seoDescription: Joi.string().max(160).allow('').messages({
    'string.max': 'SEO description cannot exceed 160 characters',
  }),
  attributes: Joi.object().allow(null).default({}),
  specifications: Joi.object().allow(null).default({}),
  customFields: Joi.object().allow(null).default({}),
  variants: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(200).allow(''),
        price: Joi.number().positive(),
        discountPrice: Joi.number().positive(),
        quantity: Joi.number().integer().min(0).required(),
        images: Joi.array().items(Joi.string().uri()).max(10).default([]),
        weight: Joi.number().positive(),
        dimensions: Joi.object(),
        attributes: Joi.object().required(),
        isActive: Joi.boolean().default(true),
        isDefault: Joi.boolean().default(false),
        sortOrder: Joi.number().integer().min(0).default(0),
      }),
    )
    .max(20)
    .default([])
    .messages({
      'array.max': 'Maximum 20 variants allowed',
    }),
});

export const updateProductSchema = createProductSchema
  .fork(['name', 'price', 'quantity', 'categoryIds', 'images'], (schema) => schema.optional())
  .append({
    status: Joi.string().valid(...Object.values(ProductStatus)),
  });

export const updatePriceSchema = Joi.object({
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be greater than 0',
    'any.required': 'Price is required',
  }),
  note: Joi.string().max(100).allow('').messages({
    'string.max': 'Note cannot exceed 100 characters',
  }),
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
  q: Joi.string().required().min(2).max(100).messages({
    'string.min': 'Search query must be at least 2 characters',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required',
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  categoryIds: Joi.alternatives().try(Joi.string().uuid(), Joi.array().items(Joi.string().uuid())),
  sortBy: Joi.string()
    .valid('createdAt', 'price', 'name', 'viewCount', 'avgRating')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(Joi.ref('minPrice')),
});

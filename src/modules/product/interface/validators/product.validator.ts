import Joi from 'joi';
import { ProductStatus } from '../../models/ProductEnums';

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(3).max(200).messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 200 characters',
  }),
  description: Joi.string().max(2000).allow(''),
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
  categories: Joi.array().items(Joi.string().uuid()).max(5).messages({
    'array.max': 'Maximum 5 categories allowed',
  }),
  images: Joi.array().items(Joi.string().uri()).min(1).max(10).required().messages({
    'array.min': 'At least one product image is required',
    'array.max': 'Maximum 10 images allowed',
    'any.required': 'Product images are required',
  }),
  tags: Joi.array().items(Joi.string().max(30)).max(10).messages({
    'array.max': 'Maximum 10 tags allowed',
    'string.max': 'Each tag cannot exceed 30 characters',
  }),
  isCustomizable: Joi.boolean().default(false),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200),
  description: Joi.string().max(2000).allow('', null),
  price: Joi.number().positive(),
  discountPrice: Joi.number().positive().allow(null).less(Joi.ref('price')),
  quantity: Joi.number().integer().min(0),
  categories: Joi.array().items(Joi.string().uuid()).max(5),
  status: Joi.string().valid(...Object.values(ProductStatus)),
  images: Joi.array().items(Joi.string().uri()).min(1).max(10),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  isCustomizable: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const updatePriceSchema = Joi.object({
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be greater than 0',
    'any.required': 'Price is required',
  }),
  note: Joi.string().max(100),
});

export const getProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sellerId: Joi.string().uuid(),
  categoryId: Joi.string().uuid(),
  search: Joi.string().max(100).allow(''),
  status: Joi.string().valid(...Object.values(ProductStatus)),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'price', 'name', 'viewCount', 'salesCount', 'avgRating')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  inStock: Joi.boolean(),
  isCustomizable: Joi.boolean(),
  minDiscountPercent: Joi.number().min(0).max(100),
  freeShipping: Joi.boolean(),
});

export const searchProductsQuerySchema = Joi.object({
  q: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Search query is required',
    'string.min': 'Search query must be at least 2 characters',
    'string.max': 'Search query cannot exceed 100 characters',
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  categoryId: Joi.string().uuid(),
  sortBy: Joi.string().valid('createdAt', 'price', 'name', 'viewCount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

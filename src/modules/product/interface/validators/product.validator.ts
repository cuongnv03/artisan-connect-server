import Joi from 'joi';
import { ProductStatus } from '../../models/ProductEnums';

const dimensionsSchema = Joi.object({
  length: Joi.number().positive(),
  width: Joi.number().positive(),
  height: Joi.number().positive(),
  unit: Joi.string().valid('cm', 'inch', 'm', 'mm'),
});

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(3).max(200).messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 200 characters',
  }),
  description: Joi.string().max(5000).allow(''),
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
  categories: Joi.array().items(Joi.string().uuid()).max(10).messages({
    'array.max': 'Maximum 10 categories allowed',
  }),
  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .default(ProductStatus.DRAFT),
  images: Joi.array().items(Joi.string().uri()).min(1).max(20).required().messages({
    'array.min': 'At least one product image is required',
    'array.max': 'Maximum 20 images allowed',
    'any.required': 'Product images are required',
  }),
  tags: Joi.array().items(Joi.string().max(50)).max(20).messages({
    'array.max': 'Maximum 20 tags allowed',
    'string.max': 'Each tag cannot exceed 50 characters',
  }),
  attributes: Joi.object(),
  isCustomizable: Joi.boolean().default(false),
  sku: Joi.string().max(100),
  weight: Joi.number().positive().messages({
    'number.positive': 'Weight must be greater than 0',
  }),
  dimensions: dimensionsSchema,
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200),
  description: Joi.string().max(5000).allow('', null),
  price: Joi.number().positive(),
  discountPrice: Joi.number().positive().allow(null).less(Joi.ref('price')),
  quantity: Joi.number().integer().min(0),
  categories: Joi.array().items(Joi.string().uuid()).max(10),
  status: Joi.string().valid(...Object.values(ProductStatus)),
  images: Joi.array().items(Joi.string().uri()).min(1).max(20),
  tags: Joi.array().items(Joi.string().max(50)).max(20),
  attributes: Joi.object().allow(null),
  isCustomizable: Joi.boolean(),
  sku: Joi.string().max(100).allow('', null),
  weight: Joi.number().positive().allow(null),
  dimensions: dimensionsSchema.allow(null),
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
  changeNote: Joi.string().max(500),
});

export const getProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sellerId: Joi.string().uuid(),
  categoryId: Joi.string().uuid(),
  search: Joi.string().max(100).allow(''),
  minPrice: Joi.number().positive(),
  maxPrice: Joi.number().positive().greater(Joi.ref('minPrice')),
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(ProductStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(ProductStatus))),
  ),
  isCustomizable: Joi.boolean(),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'price', 'name', 'viewCount', 'salesCount', 'avgRating')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  inStock: Joi.boolean(),
});

export const stockUpdateSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().required(),
        operation: Joi.string().valid('increment', 'decrement', 'set').required(),
      }),
    )
    .min(1)
    .required(),
});

export const inventoryCheckSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().positive().required(),
      }),
    )
    .min(1)
    .required(),
});

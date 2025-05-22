import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Category name is required',
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 100 characters',
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),
  imageUrl: Joi.string().uri().allow('').messages({
    'string.uri': 'Image URL must be a valid URL',
  }),
  parentId: Joi.string().uuid().allow(null, ''),
  sortOrder: Joi.number().integer().min(0).messages({
    'number.min': 'Sort order cannot be negative',
  }),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow('', null),
  imageUrl: Joi.string().uri().allow('', null),
  parentId: Joi.string().uuid().allow(null, ''),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const getCategoriesQuerySchema = Joi.object({
  includeChildren: Joi.boolean().default(false),
  includeParent: Joi.boolean().default(false),
  includeProductCount: Joi.boolean().default(false),
  includeInactive: Joi.boolean().default(false),
  level: Joi.number().integer().min(0),
  parentId: Joi.string().uuid().allow(null),
});

export const getCategoryProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'price', 'name', 'viewCount', 'salesCount')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  minPrice: Joi.number().positive(),
  maxPrice: Joi.number().positive().greater(Joi.ref('minPrice')),
  inStock: Joi.boolean(),
});

export const reorderCategoriesSchema = Joi.object({
  categoryOrders: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().uuid().required(),
        sortOrder: Joi.number().integer().min(0).required(),
      }),
    )
    .min(1)
    .required(),
});

export const moveCategorySchema = Joi.object({
  newParentId: Joi.string().uuid().allow(null).required(),
});

export const mergeCategoriesSchema = Joi.object({
  fromCategoryId: Joi.string().uuid().required(),
  toCategoryId: Joi.string().uuid().required(),
})
  .custom((value, helpers) => {
    if (value.fromCategoryId === value.toCategoryId) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid': 'Cannot merge category with itself',
  });

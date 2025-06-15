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
  sortOrder: Joi.number().integer().min(0).default(0),
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

export const createCategoryAttributeTemplateSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Attribute name is required',
    'string.min': 'Attribute name must be at least 2 characters',
    'string.max': 'Attribute name cannot exceed 100 characters',
  }),
  key: Joi.string()
    .required()
    .min(2)
    .max(50)
    .pattern(/^[a-z_][a-z0-9_]*$/)
    .messages({
      'string.empty': 'Attribute key is required',
      'string.min': 'Attribute key must be at least 2 characters',
      'string.max': 'Attribute key cannot exceed 50 characters',
      'string.pattern.base':
        'Attribute key must start with letter/underscore and contain only lowercase letters, numbers, and underscores',
    }),
  type: Joi.string()
    .valid('TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'DATE', 'URL', 'EMAIL')
    .required()
    .messages({
      'any.required': 'Attribute type is required',
      'any.only': 'Invalid attribute type',
    }),
  isRequired: Joi.boolean().default(false),
  isVariant: Joi.boolean().default(false),
  options: Joi.array()
    .items(Joi.string().max(100))
    .when('type', {
      is: Joi.string().valid('SELECT', 'MULTI_SELECT'),
      then: Joi.array().items(Joi.string().max(100)).required().min(1).messages({
        'any.required': 'Options are required for SELECT and MULTI_SELECT types',
        'array.min': 'At least one option is required',
      }),
      otherwise: Joi.forbidden(),
    }),
  unit: Joi.string().max(20).allow(''),
  sortOrder: Joi.number().integer().min(0).default(0),
  description: Joi.string().max(500).allow(''),
});

export const getCategoryAttributeTemplatesQuerySchema = Joi.object({
  includeInactive: Joi.boolean().default(false),
});

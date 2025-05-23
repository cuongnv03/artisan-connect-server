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
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow('', null),
  imageUrl: Joi.string().uri().allow('', null),
  parentId: Joi.string().uuid().allow(null, ''),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

import Joi from 'joi';

export const createReviewSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.uuid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required',
  }),
  title: Joi.string().max(200).allow('', null).messages({
    'string.max': 'Title cannot exceed 200 characters',
  }),
  comment: Joi.string().max(2000).allow('', null).messages({
    'string.max': 'Comment cannot exceed 2000 characters',
  }),
  images: Joi.array().items(Joi.string().uri()).max(5).messages({
    'array.max': 'Maximum 5 images allowed',
    'string.uri': 'Each image must be a valid URL',
  }),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
  title: Joi.string().max(200).allow('', null).messages({
    'string.max': 'Title cannot exceed 200 characters',
  }),
  comment: Joi.string().max(2000).allow('', null).messages({
    'string.max': 'Comment cannot exceed 2000 characters',
  }),
  images: Joi.array().items(Joi.string().uri()).max(5).messages({
    'array.max': 'Maximum 5 images allowed',
    'string.uri': 'Each image must be a valid URL',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const getReviewsSchema = Joi.object({
  productId: Joi.string().uuid().messages({
    'string.uuid': 'Product ID must be a valid UUID',
  }),
  userId: Joi.string().uuid().messages({
    'string.uuid': 'User ID must be a valid UUID',
  }),
  rating: Joi.number().integer().min(1).max(5).messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
  sortBy: Joi.string().valid('createdAt', 'rating', 'updatedAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

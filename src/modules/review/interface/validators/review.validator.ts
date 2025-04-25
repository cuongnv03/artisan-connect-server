import Joi from 'joi';

export const createReviewSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().max(100),
  comment: Joi.string().max(1000),
  images: Joi.array().items(Joi.string().uri()),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  title: Joi.string().max(100).allow('', null),
  comment: Joi.string().max(1000).allow('', null),
  images: Joi.array().items(Joi.string().uri()),
}).min(1);

export const markReviewHelpfulSchema = Joi.object({
  helpful: Joi.boolean().required(),
});

export const getReviewsSchema = Joi.object({
  productId: Joi.string().uuid(),
  userId: Joi.string().uuid(),
  rating: Joi.number().integer().min(1).max(5),
  sortBy: Joi.string().valid('createdAt', 'rating', 'helpful'),
  sortOrder: Joi.string().valid('asc', 'desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

import Joi from 'joi';

export const createCommentSchema = Joi.object({
  postId: Joi.string().uuid().required(),
  parentId: Joi.string().uuid(),
  content: Joi.string().required().min(1).max(2000),
  mediaUrl: Joi.string().uri(),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000),
  mediaUrl: Joi.string().uri().allow(null, ''),
}).min(1);

export const commentQuerySchema = Joi.object({
  parentId: Joi.string().uuid().allow(null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  includeReplies: Joi.boolean().default(false),
});

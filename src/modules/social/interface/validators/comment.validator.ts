import Joi from 'joi';

export const createCommentSchema = Joi.object({
  postId: Joi.string().uuid().required().messages({
    'any.required': 'Post ID is required',
  }),
  parentId: Joi.string().uuid().allow(null),
  content: Joi.string().required().min(1).max(2000).messages({
    'string.empty': 'Comment content is required',
    'string.min': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
    'any.required': 'Comment content is required',
  }),
  mediaUrl: Joi.string().uri().allow(null, '').messages({
    'string.uri': 'Media URL must be a valid URL',
  }),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).messages({
    'string.min': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
  }),
  mediaUrl: Joi.string().uri().allow(null, '').messages({
    'string.uri': 'Media URL must be a valid URL',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const commentQuerySchema = Joi.object({
  parentId: Joi.string().uuid().allow(null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  includeReplies: Joi.boolean().default(false),
  sortBy: Joi.string().valid('createdAt', 'likeCount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

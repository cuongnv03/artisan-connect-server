import Joi from 'joi';

export const savePostSchema = Joi.object({
  postId: Joi.string().uuid().required().messages({
    'any.required': 'Post ID is required',
  }),
});

export const getSavedPostsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

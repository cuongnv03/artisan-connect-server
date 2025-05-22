import Joi from 'joi';

export const likeToggleSchema = Joi.object({
  postId: Joi.string().uuid(),
  commentId: Joi.string().uuid(),
})
  .xor('postId', 'commentId')
  .messages({
    'object.xor': 'Must provide either postId or commentId, but not both',
  });

export const likeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

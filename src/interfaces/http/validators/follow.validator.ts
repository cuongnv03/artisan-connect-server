import Joi from 'joi';

export const followUserSchema = Joi.object({
  followingId: Joi.string().uuid().required(),
  notifyNewPosts: Joi.boolean().default(true),
});

export const updateNotificationSchema = Joi.object({
  notify: Joi.boolean().required(),
});

export const followQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'accepted', 'rejected'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

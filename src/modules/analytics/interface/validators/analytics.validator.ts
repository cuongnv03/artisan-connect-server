import Joi from 'joi';

export const trackViewEventSchema = Joi.object({
  postId: Joi.string().uuid().required(),
  sessionId: Joi.string().default(() => require('uuid').v4()),
  referrer: Joi.string().allow(''),
  timeSpent: Joi.number().min(0),
});

export const trackConversionEventSchema = Joi.object({
  postId: Joi.string().uuid().required(),
});

export const getInsightsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
});

export const getTrendingPostsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
});

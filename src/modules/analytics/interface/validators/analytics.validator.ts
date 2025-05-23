import Joi from 'joi';

export const trackViewEventSchema = Joi.object({
  postId: Joi.string().uuid().required().messages({
    'string.uuid': 'Post ID must be a valid UUID',
    'any.required': 'Post ID is required',
  }),
  sessionId: Joi.string()
    .default(() => require('uuid').v4())
    .messages({
      'string.base': 'Session ID must be a string',
    }),
  referrer: Joi.string().allow('', null).messages({
    'string.base': 'Referrer must be a string',
  }),
  timeSpent: Joi.number().min(0).max(86400).messages({
    // Max 24 hours
    'number.min': 'Time spent cannot be negative',
    'number.max': 'Time spent cannot exceed 24 hours',
  }),
  userAgent: Joi.string().allow('', null).max(500).messages({
    'string.max': 'User agent cannot exceed 500 characters',
  }),
  ipAddress: Joi.string().ip().allow('', null).messages({
    'string.ip': 'IP address must be valid',
  }),
});

export const trackConversionEventSchema = Joi.object({
  postId: Joi.string().uuid().required().messages({
    'string.uuid': 'Post ID must be a valid UUID',
    'any.required': 'Post ID is required',
  }),
});

export const getInsightsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30).messages({
    'number.min': 'Days must be at least 1',
    'number.max': 'Days cannot exceed 365',
  }),
});

export const getTrendingPostsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  days: Joi.number().integer().min(1).max(30).default(7).messages({
    'number.min': 'Days must be at least 1',
    'number.max': 'Days cannot exceed 30',
  }),
});

export const getUserAnalyticsQuerySchema = Joi.object({
  userId: Joi.string().uuid().messages({
    'string.uuid': 'User ID must be a valid UUID',
  }),
});

export const cleanupDataSchema = Joi.object({
  daysToKeep: Joi.number().integer().min(30).max(1095).default(365).messages({
    'number.min': 'Must keep at least 30 days of data',
    'number.max': 'Cannot keep more than 3 years of data',
  }),
});

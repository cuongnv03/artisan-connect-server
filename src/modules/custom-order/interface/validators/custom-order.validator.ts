import Joi from 'joi';
import { QuoteStatus } from '../../models/CustomOrderEnums';

export const createCustomOrderSchema = Joi.object({
  artisanId: Joi.string().uuid().required().messages({
    'string.uuid': 'Artisan ID must be a valid UUID',
    'any.required': 'Artisan ID is required',
  }),
  title: Joi.string().required().min(5).max(200).messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 5 characters',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().required().min(10).max(2000).messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 2000 characters',
    'any.required': 'Description is required',
  }),
  referenceProductId: Joi.string().uuid().allow(null).messages({
    'string.uuid': 'Reference product ID must be a valid UUID',
  }),
  specifications: Joi.object().allow(null),
  attachmentUrls: Joi.array().items(Joi.string().uri()).max(10).messages({
    'array.max': 'Maximum 10 attachments allowed',
    'string.uri': 'Attachment URLs must be valid',
  }),
  estimatedPrice: Joi.number().positive().allow(null).messages({
    'number.positive': 'Estimated price must be greater than 0',
  }),
  customerBudget: Joi.number().positive().allow(null).messages({
    'number.positive': 'Customer budget must be greater than 0',
  }),
  timeline: Joi.string().max(500).allow('').messages({
    'string.max': 'Timeline cannot exceed 500 characters',
  }),
  expiresInDays: Joi.number().integer().min(1).max(30).messages({
    'number.min': 'Expiration must be at least 1 day',
    'number.max': 'Expiration cannot exceed 30 days',
  }),
});

export const updateCustomOrderSchema = Joi.object({
  title: Joi.string().min(5).max(200),
  description: Joi.string().min(10).max(2000),
  specifications: Joi.object().allow(null),
  attachmentUrls: Joi.array().items(Joi.string().uri()).max(10),
  estimatedPrice: Joi.number().positive().allow(null),
  customerBudget: Joi.number().positive().allow(null),
  timeline: Joi.string().max(500).allow(''),
}).min(1);

export const artisanResponseSchema = Joi.object({
  action: Joi.string().valid('ACCEPT', 'REJECT', 'COUNTER_OFFER').required().messages({
    'any.required': 'Action is required',
    'any.only': 'Action must be ACCEPT, REJECT, or COUNTER_OFFER',
  }),
  finalPrice: Joi.number()
    .positive()
    .when('action', {
      is: 'COUNTER_OFFER',
      then: Joi.required().messages({
        'any.required': 'Final price is required for counter offers',
        'number.positive': 'Final price must be greater than 0',
      }),
      otherwise: Joi.optional(),
    }),
  response: Joi.object().allow(null),
  expiresInDays: Joi.number().integer().min(1).max(30).messages({
    'number.min': 'Expiration must be at least 1 day',
    'number.max': 'Expiration cannot exceed 30 days',
  }),
});

export const cancelCustomOrderSchema = Joi.object({
  reason: Joi.string().max(500).allow('').messages({
    'string.max': 'Cancellation reason cannot exceed 500 characters',
  }),
});

export const customerCounterOfferSchema = Joi.object({
  action: Joi.string().valid('COUNTER_OFFER').required(),
  finalPrice: Joi.number().positive().required().messages({
    'number.positive': 'Final price must be greater than 0',
    'any.required': 'Final price is required for counter offers',
  }),
  timeline: Joi.string().max(500).allow(''),
  message: Joi.string().max(1000).allow(''),
  response: Joi.object().allow(null),
  expiresInDays: Joi.number().integer().min(1).max(30).messages({
    'number.min': 'Expiration must be at least 1 day',
    'number.max': 'Expiration cannot exceed 30 days',
  }),
});

export const customerAcceptOfferSchema = Joi.object({
  action: Joi.string().valid('ACCEPT').required(),
  message: Joi.string().max(1000).allow(''),
});

export const customerRejectOfferSchema = Joi.object({
  action: Joi.string().valid('REJECT').required(),
  reason: Joi.string().max(500).allow(''),
  message: Joi.string().max(1000).allow(''),
});

export const getCustomOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  mode: Joi.string().valid('sent', 'received').default('sent'), // NEW
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(QuoteStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(QuoteStatus))),
  ),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status', 'title', 'finalPrice')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getStatsQuerySchema = Joi.object({
  userId: Joi.string().uuid(),
  role: Joi.string().valid('CUSTOMER', 'ARTISAN'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

import Joi from 'joi';
import { QuoteStatus, QuoteAction } from '../../models/QuoteEnums';

export const createQuoteRequestSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.uuid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  requestedPrice: Joi.number().positive().messages({
    'number.positive': 'Requested price must be greater than 0',
  }),
  specifications: Joi.string().max(2000).allow('').messages({
    'string.max': 'Specifications cannot exceed 2000 characters',
  }),
  message: Joi.string().max(1000).allow('').messages({
    'string.max': 'Message cannot exceed 1000 characters',
  }),
  expiresInDays: Joi.number().integer().min(1).max(30).messages({
    'number.min': 'Expiration must be at least 1 day',
    'number.max': 'Expiration cannot exceed 30 days',
  }),
});

export const respondToQuoteSchema = Joi.object({
  action: Joi.string()
    .valid(
      ...Object.values(QuoteAction).filter((action) =>
        ['ACCEPT', 'REJECT', 'COUNTER'].includes(action),
      ),
    )
    .required()
    .messages({
      'any.required': 'Action is required',
      'any.only': 'Action must be ACCEPT, REJECT, or COUNTER',
    }),
  counterOffer: Joi.number()
    .positive()
    .when('action', {
      is: QuoteAction.COUNTER,
      then: Joi.required().messages({
        'any.required': 'Counter offer is required when action is COUNTER',
        'number.positive': 'Counter offer must be greater than 0',
      }),
      otherwise: Joi.forbidden().messages({
        'any.unknown': 'Counter offer should only be provided when action is COUNTER',
      }),
    }),
  message: Joi.string().max(1000).allow('').messages({
    'string.max': 'Message cannot exceed 1000 characters',
  }),
});

export const addQuoteMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000).messages({
    'string.empty': 'Message cannot be empty',
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 1000 characters',
    'any.required': 'Message is required',
  }),
});

export const cancelQuoteSchema = Joi.object({
  reason: Joi.string().max(500).allow('').messages({
    'string.max': 'Cancellation reason cannot exceed 500 characters',
  }),
});

export const getQuoteRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(QuoteStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(QuoteStatus))),
  ),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status', 'requestedPrice', 'expiresAt')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getQuoteStatsQuerySchema = Joi.object({
  userId: Joi.string().uuid(),
  userRole: Joi.string().valid('CUSTOMER', 'ARTISAN'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

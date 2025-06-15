import Joi from 'joi';
import { NegotiationStatus } from '../../models/PriceNegotiationEnums';

export const createNegotiationSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.uuid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  proposedPrice: Joi.number().positive().required().messages({
    'number.positive': 'Proposed price must be greater than 0',
    'any.required': 'Proposed price is required',
  }),
  quantity: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Quantity must be at least 1',
  }),
  customerReason: Joi.string().max(1000).allow('').messages({
    'string.max': 'Customer reason cannot exceed 1000 characters',
  }),
  expiresInDays: Joi.number().integer().min(1).max(7).default(3).messages({
    'number.min': 'Expiration must be at least 1 day',
    'number.max': 'Expiration cannot exceed 7 days',
  }),
});

export const respondToNegotiationSchema = Joi.object({
  action: Joi.string().valid('ACCEPT', 'REJECT', 'COUNTER').required().messages({
    'any.required': 'Action is required',
    'any.only': 'Action must be ACCEPT, REJECT, or COUNTER',
  }),
  counterPrice: Joi.number()
    .positive()
    .when('action', {
      is: 'COUNTER',
      then: Joi.required().messages({
        'any.required': 'Counter price is required when action is COUNTER',
        'number.positive': 'Counter price must be greater than 0',
      }),
      otherwise: Joi.forbidden().messages({
        'any.unknown': 'Counter price should only be provided when action is COUNTER',
      }),
    }),
  artisanResponse: Joi.string().max(1000).allow('').messages({
    'string.max': 'Response message cannot exceed 1000 characters',
  }),
});

export const cancelNegotiationSchema = Joi.object({
  reason: Joi.string().max(500).allow('').messages({
    'string.max': 'Cancellation reason cannot exceed 500 characters',
  }),
});

export const getNegotiationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(NegotiationStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(NegotiationStatus))),
  ),
  productId: Joi.string().uuid(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status', 'proposedPrice', 'expiresAt')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getNegotiationStatsQuerySchema = Joi.object({
  userId: Joi.string().uuid(),
  userRole: Joi.string().valid('CUSTOMER', 'ARTISAN'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

import Joi from 'joi';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../models/OrderEnums';

export const createOrderFromCartSchema = Joi.object({
  addressId: Joi.string().uuid().required().messages({
    'string.uuid': 'Address ID must be a valid UUID',
    'any.required': 'Shipping address is required',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required()
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Invalid payment method',
    }),
  notes: Joi.string().max(500).allow('').messages({
    'string.max': 'Notes cannot exceed 500 characters',
  }),
});

export const createOrderFromQuoteSchema = Joi.object({
  quoteRequestId: Joi.string().uuid().required().messages({
    'string.uuid': 'Quote request ID must be a valid UUID',
    'any.required': 'Quote request ID is required',
  }),
  addressId: Joi.string().uuid().required().messages({
    'string.uuid': 'Address ID must be a valid UUID',
    'any.required': 'Shipping address is required',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required()
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Invalid payment method',
    }),
  notes: Joi.string().max(500).allow('').messages({
    'string.max': 'Notes cannot exceed 500 characters',
  }),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .required()
    .messages({
      'any.required': 'Order status is required',
      'any.only': 'Invalid order status',
    }),
  note: Joi.string().max(500).allow('').messages({
    'string.max': 'Note cannot exceed 500 characters',
  }),
  trackingNumber: Joi.string().max(100).allow('').messages({
    'string.max': 'Tracking number cannot exceed 100 characters',
  }),
  estimatedDelivery: Joi.date().iso().min('now').messages({
    'date.min': 'Estimated delivery must be in the future',
  }),
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().max(500).allow('').messages({
    'string.max': 'Cancellation reason cannot exceed 500 characters',
  }),
});

export const processPaymentSchema = Joi.object({
  paymentMethodId: Joi.string().uuid().messages({
    'string.uuid': 'Payment method ID must be a valid UUID',
  }),
  paymentReference: Joi.string().max(100).messages({
    'string.max': 'Payment reference cannot exceed 100 characters',
  }),
  externalReference: Joi.string().max(100).messages({
    'string.max': 'External reference cannot exceed 100 characters',
  }),
});

export const getOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.alternatives().try(
    Joi.string().valid(...Object.values(OrderStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(OrderStatus))),
  ),
  paymentStatus: Joi.alternatives().try(
    Joi.string().valid(...Object.values(PaymentStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(PaymentStatus))),
  ),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'totalAmount', 'status', 'orderNumber')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getOrderStatsQuerySchema = Joi.object({
  userId: Joi.string().uuid(),
  sellerId: Joi.string().uuid(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

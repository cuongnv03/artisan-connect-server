import Joi from 'joi';
import {
  OrderStatus,
  PaymentMethodType,
  PaymentStatus,
  DeliveryStatus,
  DisputeType,
  DisputeStatus,
  ReturnReason,
  ReturnStatus,
} from '../../models/OrderEnums';

export const createOrderFromCartSchema = Joi.object({
  addressId: Joi.string().uuid().required().messages({
    'string.uuid': 'Address ID must be a valid UUID',
    'any.required': 'Shipping address is required',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethodType))
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
    .valid(...Object.values(PaymentMethodType))
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
  deliveryStatus: Joi.alternatives().try(
    Joi.string().valid(...Object.values(DeliveryStatus)),
    Joi.array().items(Joi.string().valid(...Object.values(DeliveryStatus))),
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

// // Dispute validators
// export const createDisputeSchema = Joi.object({
//   orderId: Joi.string().uuid().required().messages({
//     'string.uuid': 'Order ID must be a valid UUID',
//     'any.required': 'Order ID is required',
//   }),
//   type: Joi.string()
//     .valid(...Object.values(DisputeType))
//     .required()
//     .messages({
//       'any.required': 'Dispute type is required',
//       'any.only': 'Invalid dispute type',
//     }),
//   reason: Joi.string().required().max(1000).messages({
//     'any.required': 'Dispute reason is required',
//     'string.max': 'Dispute reason cannot exceed 1000 characters',
//   }),
//   evidence: Joi.array().items(Joi.string().uri()).max(10).messages({
//     'array.max': 'Maximum 10 evidence files allowed',
//     'string.uri': 'Evidence must be valid URLs',
//   }),
// });

// export const updateDisputeSchema = Joi.object({
//   status: Joi.string()
//     .valid(...Object.values(DisputeStatus))
//     .required()
//     .messages({
//       'any.required': 'Dispute status is required',
//       'any.only': 'Invalid dispute status',
//     }),
//   resolution: Joi.string().max(1000).messages({
//     'string.max': 'Resolution cannot exceed 1000 characters',
//   }),
// });

// export const getDisputesQuerySchema = Joi.object({
//   page: Joi.number().integer().min(1).default(1),
//   limit: Joi.number().integer().min(1).max(100).default(10),
//   status: Joi.string().valid(...Object.values(DisputeStatus)),
//   type: Joi.string().valid(...Object.values(DisputeType)),
//   dateFrom: Joi.date().iso(),
//   dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
// });

// // Return validators
// export const createReturnSchema = Joi.object({
//   orderId: Joi.string().uuid().required().messages({
//     'string.uuid': 'Order ID must be a valid UUID',
//     'any.required': 'Order ID is required',
//   }),
//   reason: Joi.string()
//     .valid(...Object.values(ReturnReason))
//     .required()
//     .messages({
//       'any.required': 'Return reason is required',
//       'any.only': 'Invalid return reason',
//     }),
//   description: Joi.string().max(1000).messages({
//     'string.max': 'Description cannot exceed 1000 characters',
//   }),
//   evidence: Joi.array().items(Joi.string().uri()).max(10).messages({
//     'array.max': 'Maximum 10 evidence files allowed',
//     'string.uri': 'Evidence must be valid URLs',
//   }),
// });

// export const updateReturnSchema = Joi.object({
//   status: Joi.string()
//     .valid(...Object.values(ReturnStatus))
//     .required()
//     .messages({
//       'any.required': 'Return status is required',
//       'any.only': 'Invalid return status',
//     }),
//   refundAmount: Joi.number().positive().messages({
//     'number.positive': 'Refund amount must be positive',
//   }),
//   refundReason: Joi.string().max(500).messages({
//     'string.max': 'Refund reason cannot exceed 500 characters',
//   }),
// });

// export const getReturnsQuerySchema = Joi.object({
//   page: Joi.number().integer().min(1).default(1),
//   limit: Joi.number().integer().min(1).max(100).default(10),
//   status: Joi.string().valid(...Object.values(ReturnStatus)),
//   reason: Joi.string().valid(...Object.values(ReturnReason)),
//   dateFrom: Joi.date().iso(),
//   dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
// });

import Joi from 'joi';

export const createQuoteRequestSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  requestedPrice: Joi.number().positive(),
  specifications: Joi.string().max(1000),
  expiresInDays: Joi.number().integer().min(1).max(30),
});

export const respondToQuoteSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject', 'counter').required(),
  counterOffer: Joi.number().positive().when('action', {
    is: 'counter',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  message: Joi.string().max(1000),
});

export const addQuoteMessageSchema = Joi.object({
  message: Joi.string().required().max(1000),
});

export const convertToOrderSchema = Joi.object({
  shippingAddressId: Joi.string().uuid(),
  paymentMethod: Joi.string(),
  notes: Joi.string().max(500),
});

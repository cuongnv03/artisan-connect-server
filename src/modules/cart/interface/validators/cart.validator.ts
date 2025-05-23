import Joi from 'joi';

export const addToCartSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.uuid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Maximum 10 items per product allowed',
    'any.required': 'Quantity is required',
  }),
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Maximum 10 items per product allowed',
    'any.required': 'Quantity is required',
  }),
});

export const validateCartQuerySchema = Joi.object({
  type: Joi.string().valid('basic', 'checkout').default('basic').messages({
    'any.only': 'Validation type must be either basic or checkout',
  }),
});

export const getCartQuerySchema = Joi.object({
  details: Joi.boolean().default(false),
});

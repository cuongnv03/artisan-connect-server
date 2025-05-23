import Joi from 'joi';

// Add to cart validation
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
  customizations: Joi.object().optional().messages({
    'object.base': 'Customizations must be an object',
  }),
});

// Update cart item validation
export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Maximum 10 items per product allowed',
    'any.required': 'Quantity is required',
  }),
  customizations: Joi.object().optional().messages({
    'object.base': 'Customizations must be an object',
  }),
});

// Bulk update cart validation
export const bulkUpdateCartSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required().messages({
          'string.uuid': 'Product ID must be a valid UUID',
          'any.required': 'Product ID is required',
        }),
        quantity: Joi.number().integer().min(0).max(10).required().messages({
          'number.min': 'Quantity cannot be negative',
          'number.max': 'Maximum 10 items per product allowed',
          'any.required': 'Quantity is required',
        }),
        customizations: Joi.object().optional(),
      }),
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one item must be provided',
      'array.max': 'Maximum 50 items can be updated at once',
      'any.required': 'Items array is required',
    }),
});

// Bulk remove validation
export const bulkRemoveSchema = Joi.object({
  productIds: Joi.array().items(Joi.string().uuid()).min(1).max(50).required().messages({
    'array.min': 'At least one product ID must be provided',
    'array.max': 'Maximum 50 items can be removed at once',
    'any.required': 'Product IDs array is required',
  }),
});

// Merge guest cart validation
export const mergeGuestCartSchema = Joi.object({
  guestCartItems: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required().messages({
          'string.uuid': 'Product ID must be a valid UUID',
          'any.required': 'Product ID is required',
        }),
        quantity: Joi.number().integer().min(1).max(10).required().messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Maximum 10 items per product allowed',
          'any.required': 'Quantity is required',
        }),
        customizations: Joi.object().optional(),
      }),
    )
    .max(100)
    .required()
    .messages({
      'array.max': 'Maximum 100 items can be merged at once',
      'any.required': 'Guest cart items array is required',
    }),
});

// Move to cart from saved validation
export const moveToCartFromSavedSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Maximum 10 items per product allowed',
  }),
});

// Cart validation query params
export const validateCartQuerySchema = Joi.object({
  type: Joi.string().valid('basic', 'full', 'checkout').default('basic').messages({
    'any.only': 'Validation type must be one of: basic, full, checkout',
  }),
});

// Get cart query params
export const getCartQuerySchema = Joi.object({
  details: Joi.boolean().default(false),
  includeAnalytics: Joi.boolean().default(false),
  includeSaved: Joi.boolean().default(false),
});

// Cart export validation
export const exportCartSchema = Joi.object({
  format: Joi.string().valid('json', 'csv').default('json').messages({
    'any.only': 'Export format must be either json or csv',
  }),
  includeProductDetails: Joi.boolean().default(true),
  includeSellerInfo: Joi.boolean().default(false),
});

// Cart share validation
export const shareCartSchema = Joi.object({
  expirationHours: Joi.number().integer().min(1).max(168).default(24).messages({
    'number.min': 'Expiration must be at least 1 hour',
    'number.max': 'Expiration cannot exceed 168 hours (7 days)',
  }),
  allowModification: Joi.boolean().default(false),
  includePersonalInfo: Joi.boolean().default(false),
});

// Price sync validation
export const syncPricesQuerySchema = Joi.object({
  updatePrices: Joi.boolean().default(true),
  removeUnavailable: Joi.boolean().default(false),
  notifyChanges: Joi.boolean().default(true),
});

// Cart optimization validation
export const optimizeCartQuerySchema = Joi.object({
  removeOutOfStock: Joi.boolean().default(true),
  updatePrices: Joi.boolean().default(true),
  consolidateSellers: Joi.boolean().default(false),
  applyBestDeals: Joi.boolean().default(true),
});

// Cart analytics query validation
export const analyticsQuerySchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', 'all').default('30d'),
  includeHistory: Joi.boolean().default(false),
  includePredictions: Joi.boolean().default(false),
});

// Cart recommendations query
export const recommendationsQuerySchema = Joi.object({
  types: Joi.array()
    .items(Joi.string().valid('bundle', 'similar', 'frequently_bought_together', 'price_match'))
    .default(['similar', 'bundle']),
  limit: Joi.number().integer().min(1).max(20).default(5),
  includeCurrentItems: Joi.boolean().default(false),
});

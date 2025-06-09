import Joi from 'joi';

export const createProductVariantSchema = Joi.object({
  name: Joi.string().max(200).allow(''),
  price: Joi.number().positive().messages({
    'number.positive': 'Price must be greater than 0',
  }),
  discountPrice: Joi.number().positive().less(Joi.ref('price')).messages({
    'number.positive': 'Discount price must be greater than 0',
    'number.less': 'Discount price must be less than regular price',
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Quantity cannot be negative',
    'any.required': 'Quantity is required',
  }),
  images: Joi.array().items(Joi.string().uri()).max(10),
  weight: Joi.number().positive(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
    unit: Joi.string().valid('cm', 'mm', 'inch', 'ft').default('cm'),
  }),
  attributes: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required(),
      }),
    )
    .required()
    .min(1)
    .messages({
      'array.min': 'At least one variant attribute is required',
      'any.required': 'Variant attributes are required',
    }),
});

export const updateProductVariantSchema = Joi.object({
  name: Joi.string().max(200).allow(''),
  price: Joi.number().positive(),
  discountPrice: Joi.number().positive().less(Joi.ref('price')),
  quantity: Joi.number().integer().min(0),
  images: Joi.array().items(Joi.string().uri()).max(10),
  weight: Joi.number().positive(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
    unit: Joi.string().valid('cm', 'mm', 'inch', 'ft'),
  }),
  isActive: Joi.boolean(),
  isDefault: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
  attributes: Joi.array().items(
    Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required(),
    }),
  ),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

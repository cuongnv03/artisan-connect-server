import Joi from 'joi';
import { ProductStatus } from '../../../domain/product/valueObjects/ProductEnums';

export const createProductSchema = Joi.object({
  name: Joi.string().required().min(3).max(200),
  description: Joi.string().max(5000),
  price: Joi.number().positive().required(),
  discountPrice: Joi.number().positive().allow(null).less(Joi.ref('price')),
  quantity: Joi.number().integer().min(0).required(),
  categories: Joi.array().items(Joi.string().uuid()),
  status: Joi.string()
    .valid(...Object.values(ProductStatus))
    .required(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  tags: Joi.array().items(Joi.string()),
  attributes: Joi.object(),
  isCustomizable: Joi.boolean().default(false),
  sku: Joi.string(),
  weight: Joi.number().positive(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
    unit: Joi.string(),
  }),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200),
  description: Joi.string().max(5000).allow(null, ''),
  price: Joi.number().positive(),
  discountPrice: Joi.number().positive().allow(null).less(Joi.ref('price')),
  quantity: Joi.number().integer().min(0),
  categories: Joi.array().items(Joi.string().uuid()),
  status: Joi.string().valid(...Object.values(ProductStatus)),
  images: Joi.array().items(Joi.string().uri()).min(1),
  tags: Joi.array().items(Joi.string()),
  attributes: Joi.object(),
  isCustomizable: Joi.boolean(),
  sku: Joi.string(),
  weight: Joi.number().positive(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
    unit: Joi.string(),
  }),
}).min(1);

export const updatePriceSchema = Joi.object({
  price: Joi.number().positive().required(),
  changeNote: Joi.string().max(500),
});

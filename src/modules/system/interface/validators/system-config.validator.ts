import Joi from 'joi';

export const createConfigSchema = Joi.object({
  key: Joi.string()
    .required()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9_\.]+$/),
  value: Joi.any().required(),
  description: Joi.string().max(500),
});

export const updateConfigSchema = Joi.object({
  value: Joi.any().required(),
  description: Joi.string().max(500).allow(null, ''),
});

export const configQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow(''),
});

export const getMultipleSchema = Joi.object({
  keys: Joi.array().items(Joi.string()).required().min(1),
});

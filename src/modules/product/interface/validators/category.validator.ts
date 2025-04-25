import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().max(500),
  imageUrl: Joi.string().uri(),
  parentId: Joi.string().uuid().allow(null, ''),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow(null, ''),
  imageUrl: Joi.string().uri().allow(null, ''),
  parentId: Joi.string().uuid().allow(null, ''),
}).min(1);

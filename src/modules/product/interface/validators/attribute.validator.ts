import Joi from 'joi';
import { AttributeType } from '../../models/ProductAttribute';

export const createCategoryAttributeTemplateSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Attribute name is required',
    'string.min': 'Attribute name must be at least 2 characters',
    'string.max': 'Attribute name cannot exceed 100 characters',
  }),
  type: Joi.string()
    .valid(...Object.values(AttributeType))
    .required()
    .messages({
      'any.only': `Type must be one of: ${Object.values(AttributeType).join(', ')}`,
      'any.required': 'Attribute type is required',
    }),
  isRequired: Joi.boolean().default(false),
  isVariant: Joi.boolean().default(false),
  options: Joi.array()
    .items(Joi.string().max(50))
    .when('type', {
      is: Joi.string().valid(AttributeType.SELECT, AttributeType.MULTI_SELECT),
      then: Joi.array().items(Joi.string().max(50)).required().min(1),
      otherwise: Joi.optional(),
    }),
  unit: Joi.string().max(10).allow(''),
  description: Joi.string().max(500).allow(''),
  sortOrder: Joi.number().integer().min(0).default(0),
});

export const updateCategoryAttributeTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  type: Joi.string().valid(...Object.values(AttributeType)),
  isRequired: Joi.boolean(),
  isVariant: Joi.boolean(),
  options: Joi.array()
    .items(Joi.string().max(50))
    .when('type', {
      is: Joi.string().valid(AttributeType.SELECT, AttributeType.MULTI_SELECT),
      then: Joi.array().min(1),
      otherwise: Joi.optional(),
    }),
  unit: Joi.string().max(10).allow(''),
  description: Joi.string().max(500).allow(''),
  sortOrder: Joi.number().integer().min(0),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const setProductAttributesSchema = Joi.object({
  attributes: Joi.array()
    .items(
      Joi.object({
        key: Joi.string()
          .required()
          .pattern(/^[a-z0-9_]+$/)
          .messages({
            'string.pattern.base':
              'Attribute key must contain only lowercase letters, numbers, and underscores',
          }),
        value: Joi.string().required().max(500),
        unit: Joi.string().max(10).allow(''),
      }),
    )
    .required()
    .min(1)
    .messages({
      'array.min': 'At least one attribute is required',
      'any.required': 'Attributes array is required',
    }),
});

export const createCustomAttributeTemplateSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  type: Joi.string()
    .valid(...Object.values(AttributeType))
    .required(),
  options: Joi.array()
    .items(Joi.string().max(50))
    .when('type', {
      is: Joi.string().valid(AttributeType.SELECT, AttributeType.MULTI_SELECT),
      then: Joi.array().items(Joi.string().max(50)).required().min(1),
      otherwise: Joi.optional(),
    }),
  unit: Joi.string().max(10).allow(''),
  description: Joi.string().max(500).allow(''),
});

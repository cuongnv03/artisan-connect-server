import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  coverUrl: Joi.string().uri().allow(null, ''),
  location: Joi.string().max(100).allow(null, ''),
  website: Joi.string().uri().allow(null, ''),
  dateOfBirth: Joi.date().iso().allow(null, ''),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow(null, ''),
  socialLinks: Joi.object().pattern(Joi.string(), Joi.string().uri()).allow(null),
  preferences: Joi.object().allow(null),
});

export const createAddressSchema = Joi.object({
  fullName: Joi.string().required().max(100),
  phone: Joi.string().max(20).allow(null, ''),
  street: Joi.string().required().max(100),
  city: Joi.string().required().max(50),
  state: Joi.string().required().max(50),
  zipCode: Joi.string().required().max(20),
  country: Joi.string().required().max(50),
  isDefault: Joi.boolean().default(false),
});

export const updateAddressSchema = Joi.object({
  fullName: Joi.string().max(100),
  phone: Joi.string().max(20).allow(null, ''),
  street: Joi.string().max(100),
  city: Joi.string().max(50),
  state: Joi.string().max(50),
  zipCode: Joi.string().max(20),
  country: Joi.string().max(50),
  isDefault: Joi.boolean(),
}).min(1);

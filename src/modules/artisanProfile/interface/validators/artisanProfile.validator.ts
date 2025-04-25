import Joi from 'joi';

export const createArtisanProfileSchema = Joi.object({
  shopName: Joi.string().required().min(3).max(100),
  shopDescription: Joi.string().max(1000),
  specialties: Joi.array().items(Joi.string()),
  experience: Joi.number().integer().min(0),
  website: Joi.string().uri().allow(''),
  socialMedia: Joi.object().pattern(Joi.string(), Joi.string().uri()),
});

export const updateArtisanProfileSchema = Joi.object({
  shopName: Joi.string().min(3).max(100),
  shopDescription: Joi.string().max(1000),
  shopLogoUrl: Joi.string().uri().allow(''),
  shopBannerUrl: Joi.string().uri().allow(''),
  specialties: Joi.array().items(Joi.string()),
  experience: Joi.number().integer().min(0),
  website: Joi.string().uri().allow(''),
  socialMedia: Joi.object().pattern(Joi.string(), Joi.string().uri()),
  templateId: Joi.string(),
  templateStyle: Joi.string(),
  customData: Joi.object(),
}).min(1);

export const generateTemplateSchema = Joi.object({
  style: Joi.string().required(),
  preferences: Joi.object({
    colorScheme: Joi.string(),
    layout: Joi.string(),
    emphasis: Joi.string(),
  }),
  description: Joi.string().min(10).max(1000).required(),
});

export const artisanUpgradeRequestSchema = Joi.object({
  shopName: Joi.string().required().min(3).max(100),
  shopDescription: Joi.string().max(1000),
  specialties: Joi.array().items(Joi.string()),
  experience: Joi.number().integer().min(0),
  website: Joi.string().uri().allow(''),
  socialMedia: Joi.object().pattern(Joi.string(), Joi.string().uri()),
  reason: Joi.string().max(1000),
});

export const adminNotesSchema = Joi.object({
  adminNotes: Joi.string().required().min(5).max(1000).messages({
    'string.empty': 'Admin notes are required when rejecting a request',
    'string.min': 'Admin notes must be at least 5 characters long',
    'any.required': 'Admin notes are required when rejecting a request',
  }),
});

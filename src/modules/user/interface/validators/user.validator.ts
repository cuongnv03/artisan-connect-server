import Joi from 'joi';

// Update profile validation
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().min(1).max(50),
  bio: Joi.string().allow(null, '').max(500),
  phone: Joi.string()
    .allow(null, '')
    .pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/),
  avatarUrl: Joi.string().uri().allow(null, ''),
});

// Update user profile validation
export const updateUserProfileSchema = Joi.object({
  coverUrl: Joi.string().uri().allow(null, ''),
  location: Joi.string().max(100).allow(null, ''),
  website: Joi.string().uri().allow(null, ''),
  dateOfBirth: Joi.date().iso().allow(null, ''),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow(null, ''),
  socialLinks: Joi.object().pattern(Joi.string(), Joi.string().uri()).allow(null),
  preferences: Joi.object().allow(null),
});

// Search users validation - CHỈ CHO ARTISAN
export const searchUsersSchema = Joi.object({
  query: Joi.string().allow('').max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid('ARTISAN').default('ARTISAN'), // FORCE ARTISAN ONLY
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'),
});

// Create address validation
export const createAddressSchema = Joi.object({
  fullName: Joi.string().required().max(100),
  phone: Joi.string().max(20).allow(null, ''),
  street: Joi.string().required().max(200),
  city: Joi.string().required().max(50),
  state: Joi.string().required().max(50),
  zipCode: Joi.string().required().max(20),
  country: Joi.string().required().max(50),
  isDefault: Joi.boolean().default(false),
});

// Update address validation
export const updateAddressSchema = Joi.object({
  fullName: Joi.string().max(100),
  phone: Joi.string().max(20).allow(null, ''),
  street: Joi.string().max(200),
  city: Joi.string().max(50),
  state: Joi.string().max(50),
  zipCode: Joi.string().max(20),
  country: Joi.string().max(50),
  isDefault: Joi.boolean(),
}).min(1);

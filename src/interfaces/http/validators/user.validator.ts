import Joi from 'joi';

// Update profile validation
export const updateProfileSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  bio: Joi.string().allow(null, ''),
  phone: Joi.string().allow(null, ''),
  avatarUrl: Joi.string().uri().allow(null, ''),
});

// Change status validation
export const changeStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required(),
});

// Search users validation
export const searchUsersSchema = Joi.object({
  query: Joi.string().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

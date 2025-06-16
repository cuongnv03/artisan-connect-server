import Joi from 'joi';
import { ArtisanSpecialty } from '../../models/ArtisanEnums';

// Create artisan profile validation
export const createArtisanProfileSchema = Joi.object({
  shopName: Joi.string().required().min(3).max(100).messages({
    'string.empty': 'Shop name is required',
    'string.min': 'Shop name must be at least 3 characters long',
    'string.max': 'Shop name cannot exceed 100 characters',
  }),
  shopDescription: Joi.string().max(1000).allow('').messages({
    'string.max': 'Shop description cannot exceed 1000 characters',
  }),
  specialties: Joi.array()
    .items(Joi.string().valid(...Object.values(ArtisanSpecialty)))
    .max(5)
    .messages({
      'array.max': 'You can select up to 5 specialties',
    }),
  experience: Joi.number().integer().min(0).max(100).messages({
    'number.base': 'Experience must be a number',
    'number.min': 'Experience cannot be negative',
    'number.max': 'Experience cannot exceed 100 years',
  }),
  website: Joi.string().uri().allow('').messages({
    'string.uri': 'Website must be a valid URL',
  }),
  contactEmail: Joi.string().email().messages({
    'string.email': 'Contact email must be a valid email address',
  }),
  contactPhone: Joi.string()
    .pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/)
    .messages({
      'string.pattern.base': 'Contact phone must be a valid phone number',
    }),
  socialMedia: Joi.object().pattern(Joi.string(), Joi.string().uri()).messages({
    'object.pattern.match': 'Social media links must be valid URLs',
  }),
  businessAddress: Joi.string().max(500).allow(''),
  businessHours: Joi.object().allow(null),
  shippingInfo: Joi.object().allow(null),
  returnPolicy: Joi.string().max(2000).allow(''),
});

// Update artisan profile validation
export const updateArtisanProfileSchema = Joi.object({
  shopName: Joi.string().min(3).max(100),
  shopDescription: Joi.string().max(1000).allow(''),
  shopLogoUrl: Joi.string().uri().allow(''),
  shopBannerUrl: Joi.string().uri().allow(''),
  specialties: Joi.array()
    .items(Joi.string().valid(...Object.values(ArtisanSpecialty)))
    .max(5),
  experience: Joi.number().integer().min(0).max(100),
  website: Joi.string().uri().allow(''),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string().pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/),
  socialMedia: Joi.object().pattern(Joi.string(), Joi.string().uri()),
  businessAddress: Joi.string().max(500).allow(''),
  businessHours: Joi.object().allow(null),
  shippingInfo: Joi.object().allow(null),
  returnPolicy: Joi.string().max(2000).allow(''),
}).min(1);

// Search artisans validation
export const searchArtisansSchema = Joi.object({
  search: Joi.string().max(100).allow(''),
  specialties: Joi.string().allow(''), // comma-separated
  minRating: Joi.number().min(0).max(5),
  isVerified: Joi.boolean(),
  location: Joi.string().max(100),
  sortBy: Joi.string().valid('rating', 'reviewCount', 'createdAt', 'followCount', 'totalSales'),
  sortOrder: Joi.string().valid('asc', 'desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const getSuggestedArtisansSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 20',
  }),
});

// Upgrade request validation
export const upgradeRequestSchema = Joi.object({
  shopName: Joi.string().required().min(3).max(100),
  shopDescription: Joi.string().max(1000).allow(''),
  specialties: Joi.array()
    .items(Joi.string().valid(...Object.values(ArtisanSpecialty)))
    .max(5),
  experience: Joi.number().integer().min(0).max(100),
  website: Joi.string().uri().allow(''),
  socialMedia: Joi.object().pattern(Joi.string(), Joi.string().uri()),
  reason: Joi.string().max(1000).messages({
    'string.max': 'Reason cannot exceed 1000 characters',
  }),
  images: Joi.array().items(Joi.string().uri()).max(10), // Mới thêm
  certificates: Joi.array().items(Joi.string().uri()).max(10), // Mới thêm
  identityProof: Joi.string().uri().allow(''), // Mới thêm
});

// Admin review validation
export const adminReviewSchema = Joi.object({
  adminNotes: Joi.string()
    .max(1000)
    .when('$isRejecting', {
      is: true,
      then: Joi.required().messages({
        'any.required': 'Admin notes are required when rejecting a request',
      }),
      otherwise: Joi.optional(),
    }),
});

// Verify artisan validation
export const verifyArtisanSchema = Joi.object({
  isVerified: Joi.boolean().required().messages({
    'any.required': 'Verification status is required',
  }),
});

// Get specialty artisans validation
export const getSpecialtyArtisansSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// Get top artisans validation
export const getTopArtisansSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

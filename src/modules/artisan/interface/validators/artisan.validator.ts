import Joi from 'joi';
import { ArtisanSpecialty, TemplateStyle } from '../../models/ArtisanEnums';

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
  templateId: Joi.string(),
  templateData: Joi.object(),
}).min(1);

// Search artisans validation
export const searchArtisansSchema = Joi.object({
  search: Joi.string().max(100).allow(''),
  specialties: Joi.string().allow(''), // comma-separated
  minRating: Joi.number().min(0).max(5),
  isVerified: Joi.boolean(),
  location: Joi.string().max(100),
  sortBy: Joi.string().valid('rating', 'reviewCount', 'createdAt', 'followCount'),
  sortOrder: Joi.string().valid('asc', 'desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Template customization validation
export const templateCustomizationSchema = Joi.object({
  templateId: Joi.string().required().messages({
    'any.required': 'Template ID is required',
  }),
  colorScheme: Joi.string().valid('light', 'dark', 'warm', 'cool', 'neutral'),
  fontFamily: Joi.string().valid('Inter', 'Poppins', 'Roboto', 'Open Sans', 'Playfair Display'),
  layout: Joi.string().valid('standard', 'grid', 'masonry', 'minimal'),
  customCss: Joi.string().max(5000),
  showSections: Joi.array().items(
    Joi.string().valid('about', 'gallery', 'products', 'contact', 'testimonials'),
  ),
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

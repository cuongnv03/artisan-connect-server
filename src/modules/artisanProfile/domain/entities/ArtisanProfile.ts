/**
 * Artisan Profile entity
 */
export interface ArtisanProfile {
  id: string;
  userId: string;
  shopName: string;
  shopDescription?: string | null;
  shopLogoUrl?: string | null;
  shopBannerUrl?: string | null;
  specialties: string[];
  experience?: number | null;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialMedia?: Record<string, string> | null;
  templateId?: string | null;
  templateStyle?: string | null;
  customData?: Record<string, any> | null;
  isVerified: boolean;
  rating?: number | null;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Artisan Profile with User info
 */
export interface ArtisanProfileWithUser extends ArtisanProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * DTO for creating an artisan profile
 */
export interface CreateArtisanProfileDto {
  shopName: string;
  shopDescription?: string;
  specialties?: string[];
  experience?: number;
  website?: string;
  socialMedia?: Record<string, string>;
}

/**
 * DTO for updating an artisan profile
 */
export interface UpdateArtisanProfileDto {
  shopName?: string;
  shopDescription?: string;
  shopLogoUrl?: string;
  shopBannerUrl?: string;
  specialties?: string[];
  experience?: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialMedia?: Record<string, string>;
  templateId?: string;
  templateStyle?: string;
  customData?: Record<string, any>;
}

/**
 * Template generation DTO
 */
export interface GenerateTemplateDto {
  style: string;
  preferences: {
    colorScheme?: string;
    layout?: string;
    emphasis?: string;
  };
  description: string;
}

/**
 * Template generation result
 */
export interface TemplateResult {
  templateId: string;
  templateStyle: string;
  customData: Record<string, any>;
  preview: string;
}

/**
 * Artisan upgrade request DTO
 */
export interface ArtisanUpgradeRequestDto {
  shopName: string;
  shopDescription?: string;
  specialties?: string[];
  experience?: number;
  website?: string;
  socialMedia?: Record<string, string>;
  reason?: string;
}

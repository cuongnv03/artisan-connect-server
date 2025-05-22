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
  templateData?: Record<string, any> | null;
  isVerified: boolean;
  rating?: number | null;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtisanProfileWithUser extends ArtisanProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
    followerCount: number;
  };
}

export interface CreateArtisanProfileDto {
  shopName: string;
  shopDescription?: string;
  specialties?: string[];
  experience?: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialMedia?: Record<string, string>;
}

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
  templateData?: Record<string, any>;
}

export interface ArtisanSearchFilters {
  search?: string;
  specialties?: string[];
  minRating?: number;
  isVerified?: boolean;
  location?: string;
  sortBy?: 'rating' | 'reviewCount' | 'createdAt' | 'followCount';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateCustomizationDto {
  templateId: string;
  colorScheme?: string;
  fontFamily?: string;
  layout?: string;
  customCss?: string;
  showSections?: string[];
}

export interface TemplateResult {
  templateId: string;
  templateData: Record<string, any>;
  previewUrl: string;
}

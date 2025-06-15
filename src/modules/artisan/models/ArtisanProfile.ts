import { Decimal } from '@prisma/client/runtime/library';

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
  businessAddress?: string | null;
  businessHours?: Record<string, any> | null;
  shippingInfo?: Record<string, any> | null;
  returnPolicy?: string | null;
  isVerified: boolean;
  rating?: number | null;
  reviewCount: number;
  totalSales: Decimal; // Decimal type
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
  businessAddress?: string;
  businessHours?: Record<string, any>;
  shippingInfo?: Record<string, any>;
  returnPolicy?: string;
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
  businessAddress?: string;
  businessHours?: Record<string, any>;
  shippingInfo?: Record<string, any>;
  returnPolicy?: string;
}

export interface ArtisanSearchFilters {
  search?: string;
  specialties?: string[];
  minRating?: number;
  isVerified?: boolean;
  location?: string;
  sortBy?: 'rating' | 'reviewCount' | 'createdAt' | 'followCount' | 'totalSales';
  sortOrder?: 'asc' | 'desc';
}

// Helper để convert Decimal sang number cho API response
export const transformArtisanProfile = (
  profile: ArtisanProfile,
): Omit<ArtisanProfile, 'totalSales'> & { totalSales: number } => ({
  ...profile,
  totalSales: Number(profile.totalSales),
});

export const transformArtisanProfileWithUser = (
  profile: ArtisanProfileWithUser,
): Omit<ArtisanProfileWithUser, 'totalSales'> & { totalSales: number } => ({
  ...profile,
  totalSales: Number(profile.totalSales),
});

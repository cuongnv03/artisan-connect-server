import { User, UserRole, UserStatus } from '../../auth';
import { PaginatedResponse } from '../../../shared/interfaces/PaginatedResult';

export interface AdminUserSearchDto {
  query?: string;
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  verified?: boolean;
}

export interface AdminUserSummaryDto {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  emailVerified: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date | null;

  // Additional info for admin
  profile?: {
    location?: string | null;
    website?: string | null;
    dateOfBirth?: Date | null;
  } | null;

  artisanProfile?: {
    shopName: string;
    isVerified: boolean;
    rating?: number | null;
    reviewCount: number;
    totalSales: number;
  } | null;
}

export interface AdminUserListDto {
  users: AdminUserSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserDetailDto extends AdminUserSummaryDto {
  bio?: string | null;

  // Extended profile info
  profile?: {
    id: string;
    coverUrl?: string | null;
    location?: string | null;
    website?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    socialLinks?: Record<string, string> | null;
    preferences?: Record<string, any> | null;
    addresses: Array<{
      id: string;
      fullName: string;
      phone?: string | null;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      isDefault: boolean;
    }>;
  } | null;

  // Extended artisan info
  artisanProfile?: {
    id: string;
    shopName: string;
    shopDescription?: string | null;
    shopLogoUrl?: string | null;
    shopBannerUrl?: string | null;
    specialties: string[];
    experience?: number | null;
    website?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    isVerified: boolean;
    rating?: number | null;
    reviewCount: number;
    totalSales: number;
  } | null;

  // Activity stats
  stats?: {
    postsCount: number;
    productsCount: number;
    ordersCount: number;
    salesCount: number;
  };
}

export interface UserStatsDto {
  total: number;
  byRole: Record<UserRole, number>;
  byStatus: Record<UserStatus, number>;
  verified: number;
  unverified: number;
}

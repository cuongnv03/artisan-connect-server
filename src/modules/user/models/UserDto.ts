export interface UserProfileDto {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  emailVerified: boolean;
  phone?: string | null;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    id: string;
    coverUrl?: string | null;
    location?: string | null;
    website?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    socialLinks?: Record<string, string> | null;
    preferences?: Record<string, any> | null;
  } | null;
  artisanProfile?: {
    id: string;
    shopName: string;
    shopDescription?: string | null;
    isVerified: boolean;
    rating?: number | null;
    reviewCount: number;
  } | null;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UserSearchDto {
  query: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
}

export interface UserListDto {
  users: UserProfileDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

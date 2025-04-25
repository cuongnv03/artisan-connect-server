import { ArtisanProfile } from '../../../artisanProfile/domain/entities/ArtisanProfile';
import { UserRole, UserStatus } from '../valueObjects/UserEnums';

/**
 * User entity
 *
 * Core business entity representing a user in the system
 */
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  bio?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  emailVerified: boolean;
  phone?: string | null;
  lastSeenAt?: Date | null;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  artisanProfile?: ArtisanProfile | null; // Optional relationship to ArtisanProfile
}

/**
 * User creation attributes
 */
export interface UserCreationAttributes {
  email: string;
  username: string;
  password: string; // Note: This is the plain password, will be hashed before storage
  firstName: string;
  lastName: string;
  role?: UserRole;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
}

/**
 * User update attributes
 */
export interface UserUpdateAttributes {
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  status?: UserStatus;
  emailVerified?: boolean;
  isVerified?: boolean;
  lastSeenAt?: Date;
}

/**
 * Safe user object (without sensitive data) to return in responses
 */
export interface SafeUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  bio?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  emailVerified: boolean;
  phone?: string | null;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert User to SafeUser
 */
export const toSafeUser = (user: User): SafeUser => {
  const {
    id,
    email,
    username,
    firstName,
    lastName,
    role,
    status,
    bio,
    avatarUrl,
    isVerified,
    emailVerified,
    phone,
    followerCount,
    followingCount,
    createdAt,
    updatedAt,
  } = user;

  return {
    id,
    email,
    username,
    firstName,
    lastName,
    role,
    status,
    bio,
    avatarUrl,
    isVerified,
    emailVerified,
    phone,
    followerCount,
    followingCount,
    createdAt,
    updatedAt,
  };
};

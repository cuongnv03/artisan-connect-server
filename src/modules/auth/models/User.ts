import { UserRole, UserStatus } from './UserEnums';

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
}

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

export interface UserCreationAttributes {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
}

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

export const toSafeUser = (user: User): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser as SafeUser;
};

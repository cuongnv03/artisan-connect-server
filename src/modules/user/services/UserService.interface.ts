import { SafeUser, UserUpdateAttributes, UserStatus } from '../../auth';
import { UserProfileDto, UserListDto, UserSearchDto } from '../models/UserDto';
import { ProfileWithUser, UpdateProfileDto } from '../models/Profile';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';
import { Follow, FollowStatsDto } from '../models/Follow';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import {
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserSearchDto,
  UserStatsDto,
} from '../models/AdminUserDto';

export interface IUserService {
  // User management
  getUserById(id: string): Promise<UserProfileDto | null>;
  updateProfile(id: string, data: UserUpdateAttributes): Promise<SafeUser>;
  changeStatus(id: string, status: UserStatus): Promise<SafeUser>;
  deleteAccount(id: string): Promise<boolean>;
  searchUsers(searchDto: UserSearchDto): Promise<UserListDto>;
  updateLastSeen(id: string): Promise<void>;

  // Profile management
  getProfileByUserId(userId: string): Promise<ProfileWithUser | null>;
  updateUserProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser>;

  // Address management
  getAddressesByUserId(userId: string): Promise<Address[]>;
  createAddress(userId: string, data: CreateAddressDto): Promise<Address>;
  updateAddress(id: string, userId: string, data: UpdateAddressDto): Promise<Address>;
  deleteAddress(id: string, userId: string): Promise<boolean>;
  setAddressAsDefault(id: string, userId: string): Promise<Address>;
  getDefaultAddress(userId: string): Promise<Address | null>;

  // Follow management
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string, page: number, limit: number): Promise<PaginatedResult<any>>;
  getFollowing(userId: string, page: number, limit: number): Promise<PaginatedResult<any>>;
  getFollowStats(userId: string, currentUserId?: string): Promise<FollowStatsDto>;

  // === ADMIN METHODS ===
  adminSearchUsers(searchDto: AdminUserSearchDto): Promise<AdminUserListDto>;
  adminGetUserDetails(id: string): Promise<AdminUserDetailDto | null>;
  adminDeleteUser(id: string, adminId: string): Promise<boolean>;
  adminGetUserStats(): Promise<UserStatsDto>;
}

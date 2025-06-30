import { IUserService } from './UserService.interface';
import { UserUpdateAttributes, SafeUser, toSafeUser } from '../../auth';
import { UserStatus } from '../../auth';
import { UserProfileDto, UserListDto, UserSearchDto } from '../models/UserDto';
import { ProfileWithUser, UpdateProfileDto } from '../models/Profile';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';
import { Follow, FollowStatsDto } from '../models/Follow';
import {
  AdminUserSearchDto,
  AdminUserListDto,
  AdminUserDetailDto,
  AdminUserSummaryDto,
  UserStatsDto,
} from '../models/AdminUserDto';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { IUserRepository } from '../../auth';
import { IProfileRepository } from '../repositories/ProfileRepository.interface';
import { IAddressRepository } from '../repositories/AddressRepository.interface';
import { IFollowRepository } from '../repositories/FollowRepository.interface';
import { INotificationService } from '../../notification';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class UserService implements IUserService {
  private userRepository: IUserRepository;
  private profileRepository: IProfileRepository;
  private addressRepository: IAddressRepository;
  private followRepository: IFollowRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.profileRepository = container.resolve<IProfileRepository>('profileRepository');
    this.addressRepository = container.resolve<IAddressRepository>('addressRepository');
    this.followRepository = container.resolve<IFollowRepository>('followRepository');
  }

  // User management methods
  async getUserById(id: string): Promise<UserProfileDto | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return null;
      }

      // Get profile if exists
      const profile = await this.profileRepository.findByUserId(id);

      const userProfile: UserProfileDto = {
        ...toSafeUser(user),
        profile: profile
          ? {
              id: profile.id,
              coverUrl: profile.coverUrl,
              location: profile.location,
              website: profile.website,
              dateOfBirth: profile.dateOfBirth,
              gender: profile.gender,
              socialLinks: profile.socialLinks,
              preferences: profile.preferences,
            }
          : null,
        artisanProfile: null, // Will be populated by artisan module if user is artisan
      };

      return userProfile;
    } catch (error) {
      this.logger.error(`Error getting user by ID: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user', 'SERVICE_ERROR');
    }
  }

  async updateProfile(id: string, data: UserUpdateAttributes): Promise<SafeUser> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update user
      const updatedUser = await this.userRepository.updateUser(id, data);

      return toSafeUser(updatedUser);
    } catch (error) {
      this.logger.error(`Error updating user profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update user profile', 'SERVICE_ERROR');
    }
  }

  async changeStatus(id: string, status: UserStatus): Promise<SafeUser> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Update status
      const updatedUser = await this.userRepository.updateUser(id, { status });

      return toSafeUser(updatedUser);
    } catch (error) {
      this.logger.error(`Error changing user status: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to change user status', 'SERVICE_ERROR');
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Soft delete
      const result = await this.userRepository.softDelete(id);

      return result;
    } catch (error) {
      this.logger.error(`Error deleting user account: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete user account', 'SERVICE_ERROR');
    }
  }

  async searchUsers(searchDto: UserSearchDto): Promise<UserListDto> {
    try {
      const { query, page = 1, limit = 10, role, status } = searchDto;
      const offset = (page - 1) * limit;

      const { users, total } = await this.userRepository.search(query, limit, offset);

      // Filter by role and status if provided, default to ARTISAN for public search
      let filteredUsers = users;
      const searchRole = role || 'ARTISAN'; // BUSINESS RULE: Default search only ARTISAN

      filteredUsers = filteredUsers.filter((user) => user.role === searchRole);

      if (status) {
        filteredUsers = filteredUsers.filter((user) => user.status === status);
      }

      const userProfiles: UserProfileDto[] = filteredUsers.map((user) => ({
        ...toSafeUser(user),
        profile: null,
        artisanProfile: null,
      }));

      return {
        users: userProfiles,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      };
    } catch (error) {
      this.logger.error(`Error searching users: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to search users', 'SERVICE_ERROR');
    }
  }

  async updateLastSeen(id: string): Promise<void> {
    try {
      await this.userRepository.updateUser(id, { lastSeenAt: new Date() });
    } catch (error) {
      this.logger.error(`Error updating last seen: ${error}`);
      // Don't throw error for this operation
    }
  }

  // Profile management methods
  async getProfileByUserId(userId: string): Promise<ProfileWithUser | null> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const profile = await this.profileRepository.findByUserId(userId);

      if (!profile) {
        // Auto-create profile if not exists
        await this.profileRepository.ensureProfile(userId);
        return await this.profileRepository.findByUserId(userId);
      }

      return profile;
    } catch (error) {
      this.logger.error(`Error getting profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get profile', 'SERVICE_ERROR');
    }
  }

  async updateUserProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const profile = await this.profileRepository.updateProfile(userId, data);

      this.logger.info(`Profile updated for user: ${userId}`);

      return profile;
    } catch (error) {
      this.logger.error(`Error updating profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update profile', 'SERVICE_ERROR');
    }
  }

  // Address management methods
  async getAddressesByUserId(userId: string): Promise<Address[]> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Get addresses
      return await this.addressRepository.getAddressesByProfileId(profile.id);
    } catch (error) {
      this.logger.error(`Error getting addresses: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get addresses', 'SERVICE_ERROR');
    }
  }

  async createAddress(userId: string, data: CreateAddressDto): Promise<Address> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Create address
      const address = await this.addressRepository.createAddress(profile.id, data);

      this.logger.info(`Address created for user: ${userId}`);

      return address;
    } catch (error) {
      this.logger.error(`Error creating address: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create address', 'SERVICE_ERROR');
    }
  }

  async updateAddress(id: string, userId: string, data: UpdateAddressDto): Promise<Address> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Check if address belongs to this profile
      const belongsToProfile = await this.addressRepository.belongsToProfile(id, profile.id);
      if (!belongsToProfile) {
        throw AppError.forbidden('You can only update your own addresses', 'FORBIDDEN_ACTION');
      }

      // Update address
      const updatedAddress = await this.addressRepository.updateAddress(id, data);

      this.logger.info(`Address ${id} updated for user: ${userId}`);

      return updatedAddress;
    } catch (error) {
      this.logger.error(`Error updating address: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update address', 'SERVICE_ERROR');
    }
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Check if address belongs to this profile
      const belongsToProfile = await this.addressRepository.belongsToProfile(id, profile.id);
      if (!belongsToProfile) {
        throw AppError.forbidden('You can only delete your own addresses', 'FORBIDDEN_ACTION');
      }

      // Delete address
      const result = await this.addressRepository.delete(id);

      this.logger.info(`Address ${id} deleted for user: ${userId}`);

      return result;
    } catch (error) {
      this.logger.error(`Error deleting address: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete address', 'SERVICE_ERROR');
    }
  }

  async setAddressAsDefault(id: string, userId: string): Promise<Address> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Check if address belongs to this profile
      const belongsToProfile = await this.addressRepository.belongsToProfile(id, profile.id);
      if (!belongsToProfile) {
        throw AppError.forbidden('You can only update your own addresses', 'FORBIDDEN_ACTION');
      }

      // Set as default
      const address = await this.addressRepository.setAsDefault(id, profile.id);

      this.logger.info(`Address ${id} set as default for user: ${userId}`);

      return address;
    } catch (error) {
      this.logger.error(`Error setting address as default: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to set address as default', 'SERVICE_ERROR');
    }
  }

  async getDefaultAddress(userId: string): Promise<Address | null> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Get default address
      return await this.addressRepository.getDefaultAddress(profile.id);
    } catch (error) {
      this.logger.error(`Error getting default address: ${error}`);
      if (error instanceof AppError) throw error;
      return null;
    }
  }

  // Follow management methods
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    try {
      // Verify both users exist
      const [follower, following] = await Promise.all([
        this.userRepository.findById(followerId),
        this.userRepository.findById(followingId),
      ]);

      if (!follower) {
        throw AppError.notFound('Follower user not found', 'USER_NOT_FOUND');
      }

      if (!following) {
        throw AppError.notFound('Following user not found', 'USER_NOT_FOUND');
      }

      // BUSINESS RULE: Chỉ có thể follow ARTISAN
      if (following.role !== 'ARTISAN') {
        throw AppError.badRequest('You can only follow artisans', 'INVALID_FOLLOW_TARGET');
      }

      // Create follow relationship (repository sẽ handle thêm validation)
      const follow = await this.followRepository.createFollow(followerId, followingId);

      // Send notification
      try {
        const notificationService = container.resolve<INotificationService>('notificationService');
        await notificationService.notifyFollow(followerId, followingId);
      } catch (notifError) {
        this.logger.error(`Error sending follow notification: ${notifError}`);
      }

      this.logger.info(`User ${followerId} followed artisan ${followingId}`);
      return follow;
    } catch (error) {
      this.logger.error(`Error following user: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to follow user', 'SERVICE_ERROR');
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      // Remove follow relationship
      const result = await this.followRepository.removeFollow(followerId, followingId);

      this.logger.info(`User ${followerId} unfollowed user ${followingId}`);

      return result;
    } catch (error) {
      this.logger.error(`Error unfollowing user: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to unfollow user', 'SERVICE_ERROR');
    }
  }

  async getFollowers(userId: string, page: number, limit: number): Promise<PaginatedResult<any>> {
    try {
      // Verify user is ARTISAN
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      if (user.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans have followers', 'INVALID_OPERATION');
      }

      const result = await this.followRepository.getFollowers(userId, page, limit);

      // Transform data to include only follower information
      const transformedData = result.data.map((follow) => ({
        id: follow.follower.id,
        username: follow.follower.username,
        firstName: follow.follower.firstName,
        lastName: follow.follower.lastName,
        avatarUrl: follow.follower.avatarUrl,
        followedAt: follow.createdAt,
      }));

      return {
        data: transformedData,
        meta: result.meta,
      };
    } catch (error) {
      this.logger.error(`Error getting followers: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get followers', 'SERVICE_ERROR');
    }
  }

  async getFollowing(userId: string, page: number, limit: number): Promise<PaginatedResult<any>> {
    try {
      const result = await this.followRepository.getFollowing(userId, page, limit);

      // Transform data to include only following information
      const transformedData = result.data.map((follow) => ({
        id: follow.following.id,
        username: follow.following.username,
        firstName: follow.following.firstName,
        lastName: follow.following.lastName,
        avatarUrl: follow.following.avatarUrl,
        followedAt: follow.createdAt,
      }));

      return {
        data: transformedData,
        meta: result.meta,
      };
    } catch (error) {
      this.logger.error(`Error getting following: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get following', 'SERVICE_ERROR');
    }
  }

  async getFollowStats(userId: string, currentUserId?: string): Promise<FollowStatsDto> {
    try {
      return await this.followRepository.getFollowStats(userId, currentUserId);
    } catch (error) {
      this.logger.error(`Error getting follow stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get follow stats', 'SERVICE_ERROR');
    }
  }

  // === ADMIN METHODS ===
  async adminSearchUsers(searchDto: AdminUserSearchDto): Promise<AdminUserListDto> {
    try {
      const { query = '', page = 1, limit = 20, role, status, verified } = searchDto;
      const offset = (page - 1) * limit;

      const filters = {
        role,
        status,
        verified,
      };

      const { users, total } = await this.userRepository.adminSearchUsers(
        query,
        filters,
        limit,
        offset,
      );

      const userSummaries: AdminUserSummaryDto[] = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSeenAt: user.lastSeenAt,
        profile: user.profile
          ? {
              location: user.profile.location,
              website: user.profile.website,
              dateOfBirth: user.profile.dateOfBirth,
            }
          : null,
        artisanProfile: user.artisanProfile
          ? {
              shopName: user.artisanProfile.shopName,
              isVerified: user.artisanProfile.isVerified,
              rating: user.artisanProfile.rating,
              reviewCount: user.artisanProfile.reviewCount,
              totalSales: parseFloat(user.artisanProfile.totalSales.toString()),
            }
          : null,
      }));

      return {
        users: userSummaries,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error in admin search users: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to search users', 'SERVICE_ERROR');
    }
  }

  async adminGetUserDetails(id: string): Promise<AdminUserDetailDto | null> {
    try {
      const userWithDetails = await this.userRepository.getUserWithDetails(id);

      if (!userWithDetails) {
        return null;
      }

      const user = userWithDetails as any;

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        bio: user.bio,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSeenAt: user.lastSeenAt,

        profile: user.profile
          ? {
              id: user.profile.id,
              coverUrl: user.profile.coverUrl,
              location: user.profile.location,
              website: user.profile.website,
              dateOfBirth: user.profile.dateOfBirth,
              gender: user.profile.gender,
              socialLinks: user.profile.socialLinks,
              preferences: user.profile.preferences,
              addresses: user.profile.addresses || [],
            }
          : null,

        artisanProfile: user.artisanProfile
          ? {
              id: user.artisanProfile.id,
              shopName: user.artisanProfile.shopName,
              shopDescription: user.artisanProfile.shopDescription,
              shopLogoUrl: user.artisanProfile.shopLogoUrl,
              shopBannerUrl: user.artisanProfile.shopBannerUrl,
              specialties: user.artisanProfile.specialties,
              experience: user.artisanProfile.experience,
              website: user.artisanProfile.website,
              contactEmail: user.artisanProfile.contactEmail,
              contactPhone: user.artisanProfile.contactPhone,
              isVerified: user.artisanProfile.isVerified,
              rating: user.artisanProfile.rating,
              reviewCount: user.artisanProfile.reviewCount,
              totalSales: parseFloat(user.artisanProfile.totalSales?.toString() || '0'),
            }
          : null,

        stats: user._count
          ? {
              postsCount: user._count.posts || 0,
              productsCount: user._count.products || 0,
              ordersCount: user._count.orders || 0,
              salesCount: user._count.sellerOrders || 0,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Error getting admin user details: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user details', 'SERVICE_ERROR');
    }
  }

  async adminDeleteUser(id: string, adminId: string): Promise<boolean> {
    try {
      const result = await this.userRepository.adminSoftDelete(id, adminId);

      if (result) {
        this.logger.info(`Admin ${adminId} deleted user ${id}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error in admin delete user: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete user', 'SERVICE_ERROR');
    }
  }

  async adminGetUserStats(): Promise<UserStatsDto> {
    try {
      return await this.userRepository.getUserStats();
    } catch (error) {
      this.logger.error(`Error getting user stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user statistics', 'SERVICE_ERROR');
    }
  }
}

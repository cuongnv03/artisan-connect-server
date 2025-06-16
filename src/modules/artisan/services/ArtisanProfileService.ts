import { IArtisanProfileService } from './ArtisanProfileService.interface';
import {
  ArtisanProfile,
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
  ArtisanSearchFilters,
} from '../models/ArtisanProfile';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
  CreateUpgradeRequestDto,
} from '../models/ArtisanUpgradeRequest';
import { UpgradeRequestStatus } from '../models/ArtisanEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { IArtisanProfileRepository } from '../repositories/ArtisanProfileRepository.interface';
import { IUpgradeRequestRepository } from '../repositories/UpgradeRequestRepository.interface';
import { IFollowRepository } from '../../user';
import { IUserRepository } from '../../auth';
import { CloudinaryService } from '../../../core/infrastructure/storage/CloudinaryService';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { UserRole } from '../../auth';
import container from '../../../core/di/container';

export class ArtisanProfileService implements IArtisanProfileService {
  private artisanProfileRepository: IArtisanProfileRepository;
  private upgradeRequestRepository: IUpgradeRequestRepository;
  private userRepository: IUserRepository;
  private cloudinaryService: CloudinaryService;
  private logger = Logger.getInstance();

  constructor() {
    this.artisanProfileRepository = container.resolve<IArtisanProfileRepository>(
      'artisanProfileRepository',
    );
    this.upgradeRequestRepository = container.resolve<IUpgradeRequestRepository>(
      'upgradeRequestRepository',
    );
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.cloudinaryService = container.resolve<CloudinaryService>('cloudinaryService');
  }

  // Artisan Profile Management
  async createArtisanProfile(
    userId: string,
    data: CreateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    try {
      // Check if user exists and is eligible
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Check if user is already an artisan
      if (user.role === UserRole.ARTISAN) {
        throw AppError.conflict('User is already an artisan');
      }

      // Check if profile already exists
      const existingProfile = await this.artisanProfileRepository.findByUserId(userId);
      if (existingProfile) {
        throw AppError.conflict('User already has an artisan profile');
      }

      // Create profile
      const profile = await this.artisanProfileRepository.createProfile(userId, data);

      // Update user role
      await this.userRepository.updateUserRole(userId, UserRole.ARTISAN);

      this.logger.info(`Artisan profile created for user ${userId}`);

      return profile;
    } catch (error) {
      this.logger.error(`Error creating artisan profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create artisan profile', 'SERVICE_ERROR');
    }
  }

  async updateArtisanProfile(
    userId: string,
    data: UpdateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    try {
      // Check if profile exists
      const existingProfile = await this.artisanProfileRepository.findByUserId(userId);
      if (!existingProfile) {
        throw AppError.notFound('Artisan profile not found');
      }

      // Handle image updates (delete old images if new ones provided)
      if (
        data.shopLogoUrl &&
        existingProfile.shopLogoUrl &&
        existingProfile.shopLogoUrl !== data.shopLogoUrl
      ) {
        await this.deleteOldImage(existingProfile.shopLogoUrl);
      }

      if (
        data.shopBannerUrl &&
        existingProfile.shopBannerUrl &&
        existingProfile.shopBannerUrl !== data.shopBannerUrl
      ) {
        await this.deleteOldImage(existingProfile.shopBannerUrl);
      }

      // Update profile
      const updatedProfile = await this.artisanProfileRepository.updateProfile(userId, data);

      this.logger.info(`Artisan profile updated for user ${userId}`);

      return updatedProfile;
    } catch (error) {
      this.logger.error(`Error updating artisan profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update artisan profile', 'SERVICE_ERROR');
    }
  }

  async getArtisanProfileById(id: string): Promise<ArtisanProfileWithUser | null> {
    try {
      return await this.artisanProfileRepository.findByIdWithUser(id);
    } catch (error) {
      this.logger.error(`Error getting artisan profile by ID: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisan profile', 'SERVICE_ERROR');
    }
  }

  async getArtisanProfileByUserId(userId: string): Promise<ArtisanProfileWithUser | null> {
    try {
      return await this.artisanProfileRepository.findByUserId(userId);
    } catch (error) {
      this.logger.error(`Error getting artisan profile by user ID: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisan profile', 'SERVICE_ERROR');
    }
  }

  async getMyArtisanProfile(userId: string): Promise<ArtisanProfileWithUser> {
    try {
      const profile = await this.artisanProfileRepository.findByUserId(userId);
      if (!profile) {
        throw AppError.notFound('Artisan profile not found for this user');
      }
      return profile;
    } catch (error) {
      this.logger.error(`Error getting own artisan profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisan profile', 'SERVICE_ERROR');
    }
  }

  async deleteArtisanProfile(userId: string): Promise<boolean> {
    try {
      // Get profile first to clean up images
      const profile = await this.artisanProfileRepository.findByUserId(userId);
      if (!profile) {
        throw AppError.notFound('Artisan profile not found');
      }

      // Delete associated images
      if (profile.shopLogoUrl) {
        await this.deleteOldImage(profile.shopLogoUrl);
      }
      if (profile.shopBannerUrl) {
        await this.deleteOldImage(profile.shopBannerUrl);
      }

      // Delete profile
      await this.artisanProfileRepository.delete(profile.id);

      // Update user role back to customer
      await this.userRepository.updateUserRole(userId, UserRole.CUSTOMER);

      this.logger.info(`Artisan profile deleted for user ${userId}`);

      return true;
    } catch (error) {
      this.logger.error(`Error deleting artisan profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete artisan profile', 'SERVICE_ERROR');
    }
  }

  // Artisan Discovery
  async searchArtisans(
    filters: ArtisanSearchFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<ArtisanProfileWithUser>> {
    try {
      return await this.artisanProfileRepository.searchArtisans(filters, page, limit);
    } catch (error) {
      this.logger.error(`Error searching artisans: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to search artisans', 'SERVICE_ERROR');
    }
  }

  async getTopArtisans(limit: number = 10): Promise<ArtisanProfileWithUser[]> {
    try {
      return await this.artisanProfileRepository.getTopArtisans(limit);
    } catch (error) {
      this.logger.error(`Error getting top artisans: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get top artisans', 'SERVICE_ERROR');
    }
  }

  async getArtisansBySpecialty(
    specialty: string,
    limit: number = 10,
  ): Promise<ArtisanProfileWithUser[]> {
    try {
      return await this.artisanProfileRepository.getArtisansBySpecialty(specialty, limit);
    } catch (error) {
      this.logger.error(`Error getting artisans by specialty: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisans by specialty', 'SERVICE_ERROR');
    }
  }

  async getFeaturedArtisans(): Promise<ArtisanProfileWithUser[]> {
    try {
      // Get a mix of top-rated and recently joined verified artisans
      const topRated = await this.artisanProfileRepository.getTopArtisans(5);

      // You could add more logic here to mix different types of featured artisans
      return topRated;
    } catch (error) {
      this.logger.error(`Error getting featured artisans: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get featured artisans', 'SERVICE_ERROR');
    }
  }

  async getSuggestedArtisans(userId: string, limit: number = 5): Promise<ArtisanProfileWithUser[]> {
    try {
      // Lấy danh sách nghệ nhân đã follow
      const followedArtisanIds = await this.getFollowedArtisanIds(userId);

      // Thêm chính user hiện tại vào danh sách loại trừ
      const excludeUserIds = [...followedArtisanIds, userId];

      const suggestions = await this.artisanProfileRepository.getSuggestedArtisans(
        excludeUserIds,
        limit,
      );

      this.logger.info(`Retrieved ${suggestions.length} unfollowed artisans for user ${userId}`);

      return suggestions;
    } catch (error) {
      this.logger.error(`Error getting suggested artisans: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get suggested artisans', 'SERVICE_ERROR');
    }
  }

  // Upgrade Request Management
  async requestUpgrade(
    userId: string,
    data: CreateUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Check if user is already an artisan
      if (user.role === UserRole.ARTISAN) {
        throw AppError.conflict('User is already an artisan');
      }

      // Check for existing request
      const existingRequest = await this.upgradeRequestRepository.findByUserId(userId);

      if (existingRequest) {
        if (existingRequest.status === UpgradeRequestStatus.PENDING) {
          throw AppError.conflict('You already have a pending upgrade request');
        } else if (existingRequest.status === UpgradeRequestStatus.REJECTED) {
          // Update existing rejected request
          return await this.upgradeRequestRepository.updateRequest(existingRequest.id, {
            ...data,
            status: UpgradeRequestStatus.PENDING,
            adminNotes: null,
            reviewedBy: null,
            reviewedAt: null,
          });
        }
      }

      // Create new upgrade request
      const request = await this.upgradeRequestRepository.createRequest(userId, data);

      this.logger.info(`Upgrade request created for user ${userId}`);

      return request;
    } catch (error) {
      this.logger.error(`Error creating upgrade request: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create upgrade request', 'SERVICE_ERROR');
    }
  }

  async getUpgradeRequestStatus(userId: string): Promise<any> {
    try {
      const request = await this.upgradeRequestRepository.findByUserId(userId);

      if (!request) {
        return { hasRequest: false };
      }

      return {
        hasRequest: true,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        adminNotes: request.adminNotes,
        reviewedAt: request.reviewedAt,
      };
    } catch (error) {
      this.logger.error(`Error getting upgrade request status: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get upgrade request status', 'SERVICE_ERROR');
    }
  }

  async updateUpgradeRequest(
    userId: string,
    data: CreateUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      const existingRequest = await this.upgradeRequestRepository.findByUserId(userId);
      if (!existingRequest) {
        throw AppError.notFound('Upgrade request not found');
      }

      if (existingRequest.status !== UpgradeRequestStatus.PENDING) {
        throw AppError.badRequest('Can only update pending requests');
      }

      return await this.upgradeRequestRepository.updateRequest(existingRequest.id, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error updating upgrade request: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update upgrade request', 'SERVICE_ERROR');
    }
  }

  // Admin Functions
  async getUpgradeRequests(
    status?: UpgradeRequestStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>> {
    try {
      return await this.upgradeRequestRepository.getRequests(status, page, limit);
    } catch (error) {
      this.logger.error(`Error getting upgrade requests: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get upgrade requests', 'SERVICE_ERROR');
    }
  }

  async approveUpgradeRequest(
    requestId: string,
    adminId: string,
    adminNotes?: string,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      const request = await this.upgradeRequestRepository.findById(requestId);
      if (!request) {
        throw AppError.notFound('Upgrade request not found');
      }

      if (request.status !== UpgradeRequestStatus.PENDING) {
        throw AppError.badRequest('Request has already been processed');
      }

      const updatedRequest = await this.upgradeRequestRepository.approveRequest(
        requestId,
        adminId,
        adminNotes,
      );

      this.logger.info(`Upgrade request ${requestId} approved by admin ${adminId}`);

      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error approving upgrade request: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to approve upgrade request', 'SERVICE_ERROR');
    }
  }

  async rejectUpgradeRequest(
    requestId: string,
    adminId: string,
    adminNotes: string,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      const request = await this.upgradeRequestRepository.findById(requestId);
      if (!request) {
        throw AppError.notFound('Upgrade request not found');
      }

      if (request.status !== UpgradeRequestStatus.PENDING) {
        throw AppError.badRequest('Request has already been processed');
      }

      const updatedRequest = await this.upgradeRequestRepository.rejectRequest(
        requestId,
        adminId,
        adminNotes,
      );

      this.logger.info(`Upgrade request ${requestId} rejected by admin ${adminId}`);

      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error rejecting upgrade request: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to reject upgrade request', 'SERVICE_ERROR');
    }
  }

  async verifyArtisan(profileId: string, isVerified: boolean): Promise<ArtisanProfile> {
    try {
      const profile = await this.artisanProfileRepository.verifyArtisan(profileId, isVerified);

      this.logger.info(`Artisan profile ${profileId} verification status changed to ${isVerified}`);

      return profile;
    } catch (error) {
      this.logger.error(`Error verifying artisan: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to verify artisan', 'SERVICE_ERROR');
    }
  }

  // Utility Methods
  async updateArtisanRating(
    profileId: string,
    newRating: number,
    reviewCount: number,
  ): Promise<void> {
    try {
      await this.artisanProfileRepository.updateRating(profileId, newRating, reviewCount);
    } catch (error) {
      this.logger.error(`Error updating artisan rating: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update artisan rating', 'SERVICE_ERROR');
    }
  }

  async updateTotalSales(profileId: string, totalSales: number): Promise<void> {
    try {
      await this.artisanProfileRepository.updateTotalSales(profileId, totalSales);
    } catch (error) {
      this.logger.error(`Error updating total sales: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update total sales', 'SERVICE_ERROR');
    }
  }

  // Helper Methods
  private async deleteOldImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl && imageUrl.includes('cloudinary')) {
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting old image: ${error}`);
      // Don't throw error, just log it
    }
  }

  private extractPublicIdFromUrl(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const afterUpload = parts[1];
    const withoutParams = afterUpload.split('/').pop();
    if (!withoutParams) return null;

    const publicId = withoutParams.split('.')[0];
    return publicId;
  }

  // Helper method để lấy danh sách artisan đã follow
  private async getFollowedArtisanIds(userId: string): Promise<string[]> {
    try {
      const followRepository = container.resolve<IFollowRepository>('followRepository');

      // Sử dụng Prisma trực tiếp để lấy danh sách follow
      const { PrismaClientManager } = await import('../../../core/database/PrismaClient');
      const prisma = PrismaClientManager.getClient();

      const follows = await prisma.follow.findMany({
        where: {
          followerId: userId,
          following: { role: 'ARTISAN' }, // Chỉ lấy những người follow là ARTISAN
        },
        select: { followingId: true },
      });

      return follows.map((f) => f.followingId);
    } catch (error) {
      this.logger.error(`Error getting followed artisan IDs: ${error}`);
      return []; // Trả về mảng rỗng nếu có lỗi
    }
  }
}

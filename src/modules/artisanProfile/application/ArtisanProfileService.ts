import { IArtisanProfileService } from './ArtisanProfileService.interface';
import {
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
  GenerateTemplateDto,
  ArtisanUpgradeRequestDto,
  TemplateResult,
} from '../domain/entities/ArtisanProfile';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
} from '../domain/entities/ArtisanUpgradeRequest';
import { UpgradeRequestStatus } from '../domain/valueObjects/ArtisanProfileEnums';
import { IArtisanProfileRepository } from '../domain/repositories/ArtisanProfileRepository.interface';
import { IUpgradeRequestRepository } from '../domain/repositories/UpgradeRequestRepository.interface';
import { IUserRepository } from '../../user/domain/repositories/UserRepository.interface';
import { CloudinaryService } from '../../../core/storage/CloudinaryService';
import { AITemplateService } from '../../../core/ai/AITemplateService';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { UserRole } from '../../user/domain/valueObjects/UserEnums';
import container from '../../../core/di/container';

/**
 * Artisan Profile service implementation
 */
export class ArtisanProfileService implements IArtisanProfileService {
  private artisanProfileRepository: IArtisanProfileRepository;
  private upgradeRequestRepository: IUpgradeRequestRepository;
  private userRepository: IUserRepository;
  private cloudinaryService: CloudinaryService;
  private aiTemplateService: AITemplateService;
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
    this.aiTemplateService = container.resolve<AITemplateService>('aiTemplateService');
  }

  /**
   * Create artisan profile
   */
  async createArtisanProfile(
    userId: string,
    data: CreateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser> {
    try {
      // Check if profile already exists
      const existingProfile = await this.artisanProfileRepository.findByUserId(userId);
      if (existingProfile) {
        throw AppError.conflict('User already has an artisan profile', 'PROFILE_EXISTS');
      }

      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Create profile
      const profile = await this.artisanProfileRepository.createProfile(userId, data);

      // Update user role
      await this.userRepository.updateUserRole(userId, UserRole.ARTISAN);

      return profile;
    } catch (error) {
      this.logger.error(`Error creating artisan profile: ${error}`);
      throw error;
    }
  }

  /**
   * Update artisan profile
   */
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

      // Handle logo replacement if needed
      if (
        data.shopLogoUrl &&
        existingProfile.shopLogoUrl &&
        existingProfile.shopLogoUrl !== data.shopLogoUrl
      ) {
        await this.deleteOldProfileImage(existingProfile.shopLogoUrl);
      }

      // Handle banner replacement if needed
      if (
        data.shopBannerUrl &&
        existingProfile.shopBannerUrl &&
        existingProfile.shopBannerUrl !== data.shopBannerUrl
      ) {
        await this.deleteOldProfileImage(existingProfile.shopBannerUrl);
      }

      // Update profile
      return await this.artisanProfileRepository.updateProfile(userId, data);
    } catch (error) {
      this.logger.error(`Error updating artisan profile: ${error}`);
      throw error;
    }
  }

  /**
   * Get artisan profile by ID
   */
  async getArtisanProfileById(id: string): Promise<ArtisanProfileWithUser | null> {
    try {
      return await this.artisanProfileRepository.findByIdWithUser(id);
    } catch (error) {
      this.logger.error(`Error getting artisan profile by ID: ${error}`);
      throw error;
    }
  }

  /**
   * Get artisan profile by user ID
   */
  async getArtisanProfileByUserId(userId: string): Promise<ArtisanProfileWithUser | null> {
    try {
      return await this.artisanProfileRepository.findByUserId(userId);
    } catch (error) {
      this.logger.error(`Error getting artisan profile by user ID: ${error}`);
      throw error;
    }
  }

  /**
   * Get current user's artisan profile
   */
  async getMyArtisanProfile(userId: string): Promise<ArtisanProfileWithUser> {
    try {
      const profile = await this.artisanProfileRepository.findByUserId(userId);
      if (!profile) {
        throw AppError.notFound('Artisan profile not found for this user');
      }
      return profile;
    } catch (error) {
      this.logger.error(`Error getting own artisan profile: ${error}`);
      throw error;
    }
  }

  /**
   * Generate template using AI
   */
  async generateTemplate(userId: string, data: GenerateTemplateDto): Promise<TemplateResult> {
    try {
      // Check if profile exists
      const profile = await this.artisanProfileRepository.findByUserId(userId);
      if (!profile) {
        throw AppError.notFound('Artisan profile not found');
      }

      // Generate template using AI service
      const templateResult = await this.aiTemplateService.generateTemplate(data);

      // Update profile with template info
      await this.artisanProfileRepository.updateProfile(userId, {
        templateId: templateResult.templateId,
        templateStyle: templateResult.templateStyle,
        customData: templateResult.customData,
      });

      return templateResult;
    } catch (error) {
      this.logger.error(`Error generating template: ${error}`);
      throw error;
    }
  }

  /**
   * Get default templates
   */
  async getDefaultTemplates(): Promise<any[]> {
    try {
      return [
        {
          id: 'template-traditional',
          name: 'Traditional',
          description: 'Classic design with elegant typography and warm colors',
          thumbnail: 'https://example.com/template-previews/traditional.jpg',
          style: 'traditional',
        },
        {
          id: 'template-modern',
          name: 'Modern',
          description: 'Clean, minimalist design with bold accents',
          thumbnail: 'https://example.com/template-previews/modern.jpg',
          style: 'modern',
        },
        {
          id: 'template-artistic',
          name: 'Artistic',
          description: 'Creative layout with unique visual elements',
          thumbnail: 'https://example.com/template-previews/artistic.jpg',
          style: 'artistic',
        },
        {
          id: 'template-vintage',
          name: 'Vintage',
          description: 'Retro-inspired design with textured elements',
          thumbnail: 'https://example.com/template-previews/vintage.jpg',
          style: 'vintage',
        },
      ];
    } catch (error) {
      this.logger.error(`Error getting default templates: ${error}`);
      throw error;
    }
  }

  /**
   * Request upgrade to artisan
   */
  async requestUpgrade(
    userId: string,
    data: ArtisanUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Check if user is already an artisan
      if (user.role === UserRole.ARTISAN) {
        throw AppError.conflict('User is already an artisan', 'ALREADY_ARTISAN');
      }

      // Check if user has profile with avatar
      if (!user.avatarUrl) {
        throw AppError.badRequest(
          'Please complete your basic profile with avatar before requesting artisan upgrade',
          'INCOMPLETE_PROFILE',
        );
      }

      // Check for existing request
      const existingRequest = await this.upgradeRequestRepository.findByUserId(userId);

      if (existingRequest) {
        if (existingRequest.status === UpgradeRequestStatus.PENDING) {
          throw AppError.conflict('You already have a pending upgrade request', 'PENDING_REQUEST');
        } else if (existingRequest.status === UpgradeRequestStatus.REJECTED) {
          // Update existing rejected request
          return this.upgradeRequestRepository.updateUpgradeRequest(existingRequest.id, {
            ...data,
            status: UpgradeRequestStatus.PENDING,
            adminNotes: null,
          });
        }
      }

      // Create new upgrade request
      return this.upgradeRequestRepository.createUpgradeRequest(userId, data);
    } catch (error) {
      this.logger.error(`Error requesting upgrade: ${error}`);
      throw error;
    }
  }

  /**
   * Get upgrade request status
   */
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
      };
    } catch (error) {
      this.logger.error(`Error getting upgrade request status: ${error}`);
      throw error;
    }
  }

  /**
   * Get all upgrade requests for admin
   */
  async getUpgradeRequests(
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>> {
    try {
      return this.upgradeRequestRepository.getUpgradeRequests(status, page, limit);
    } catch (error) {
      this.logger.error(`Error getting upgrade requests: ${error}`);
      throw error;
    }
  }

  /**
   * Approve upgrade request (admin only)
   */
  async approveUpgradeRequest(
    requestId: string,
    adminNotes?: string,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      // Get the request
      const request = await this.upgradeRequestRepository.findById(requestId);
      if (!request) {
        throw AppError.notFound('Upgrade request not found');
      }

      if (request.status !== UpgradeRequestStatus.PENDING) {
        throw AppError.badRequest('This request has already been processed', 'ALREADY_PROCESSED');
      }

      // Process the approval
      return this.upgradeRequestRepository.approveRequest(requestId, adminNotes);
    } catch (error) {
      this.logger.error(`Error approving upgrade request: ${error}`);
      throw error;
    }
  }

  /**
   * Reject upgrade request (admin only)
   */
  async rejectUpgradeRequest(
    requestId: string,
    adminNotes: string,
  ): Promise<ArtisanUpgradeRequest> {
    try {
      // Get the request
      const request = await this.upgradeRequestRepository.findById(requestId);
      if (!request) {
        throw AppError.notFound('Upgrade request not found');
      }

      if (request.status !== UpgradeRequestStatus.PENDING) {
        throw AppError.badRequest('This request has already been processed', 'ALREADY_PROCESSED');
      }

      // Process the rejection
      return this.upgradeRequestRepository.rejectRequest(requestId, adminNotes);
    } catch (error) {
      this.logger.error(`Error rejecting upgrade request: ${error}`);
      throw error;
    }
  }

  /**
   * Helper method to delete old profile image from cloudinary
   */
  private async deleteOldProfileImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl && imageUrl.includes('cloudinary')) {
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting old profile image: ${error}`);
      // Don't throw error, just log it
    }
  }

  /**
   * Helper method to extract public ID from Cloudinary URL
   */
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
}

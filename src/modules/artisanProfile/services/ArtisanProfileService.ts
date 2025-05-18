import { IArtisanProfileService } from './ArtisanProfileService.interface';
import {
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
  GenerateTemplateDto,
  ArtisanUpgradeRequestDto,
  TemplateResult,
} from '../models/ArtisanProfile';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
} from '../models/ArtisanUpgradeRequest';
import { UpgradeRequestStatus } from '../models/ArtisanProfileEnums';
import { IArtisanProfileRepository } from '../repositories/ArtisanProfileRepository.interface';
import { IUpgradeRequestRepository } from '../repositories/UpgradeRequestRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { CloudinaryService } from '../../../core/infrastructure/storage/CloudinaryService';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { UserRole } from '../../user/models/UserEnums';
import container from '../../../core/di/container';

/**
 * Artisan Profile service implementation
 */
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

      this.logger.info(`Artisan profile created for user ${userId}`);

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
      const updatedProfile = await this.artisanProfileRepository.updateProfile(userId, data);

      this.logger.info(`Artisan profile updated for user ${userId}`);

      return updatedProfile;
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
   * Generate template
   * Simplified implementation instead of using AI service
   */
  async generateTemplate(userId: string, data: GenerateTemplateDto): Promise<TemplateResult> {
    try {
      // Check if profile exists
      const profile = await this.artisanProfileRepository.findByUserId(userId);
      if (!profile) {
        throw AppError.notFound('Artisan profile not found');
      }

      // Generate template ID
      const templateId = `template-${Math.random().toString(36).substring(2, 11)}`;

      // Create simple template data based on style and preferences
      const customData = this.generateSimpleTemplateData(data);

      // Update profile with template info
      await this.artisanProfileRepository.updateProfile(userId, {
        templateId: templateId,
        templateStyle: data.style,
        customData: customData,
      });

      this.logger.info(`Template generated for user ${userId} with style ${data.style}`);

      return {
        templateId,
        templateStyle: data.style,
        customData,
        preview: `https://example.com/template-previews/${data.style.toLowerCase()}.jpg`,
      };
    } catch (error) {
      this.logger.error(`Error generating template: ${error}`);
      throw error;
    }
  }

  /**
   * Simple template data generator
   * (Replacement for AITemplateService)
   */
  private generateSimpleTemplateData(data: GenerateTemplateDto): Record<string, any> {
    const { style, preferences } = data;

    // Generate color palette based on preferences
    const colorPalette = this.getColorPalette(preferences.colorScheme || 'neutral');

    // Determine layout
    const layout = preferences.layout || 'standard';

    return {
      colorPalette,
      layout,
      emphasis: preferences.emphasis || 'balanced',
      styleElements: {
        fonts: this.getFontsForStyle(style),
        borders: this.getBordersForStyle(style),
        accents: this.getAccentsForStyle(style),
      },
      sections: this.getSectionsForLayout(layout),
    };
  }

  /**
   * Get color palette based on preference
   */
  private getColorPalette(scheme: string): Record<string, string> {
    const palettes: Record<string, Record<string, string>> = {
      warm: {
        primary: '#e63946',
        secondary: '#f1faee',
        accent: '#a8dadc',
        background: '#f9f7f3',
        text: '#1d3557',
      },
      cool: {
        primary: '#457b9d',
        secondary: '#f1faee',
        accent: '#e63946',
        background: '#f8f9fa',
        text: '#1d3557',
      },
      earthy: {
        primary: '#606c38',
        secondary: '#fefae0',
        accent: '#dda15e',
        background: '#faedcd',
        text: '#283618',
      },
      neutral: {
        primary: '#2a9d8f',
        secondary: '#e9c46a',
        accent: '#f4a261',
        background: '#f8f9fa',
        text: '#264653',
      },
    };

    return palettes[scheme] || palettes.neutral;
  }

  /**
   * Get font settings for style
   */
  private getFontsForStyle(style: string): Record<string, string> {
    const fontSets: Record<string, Record<string, string>> = {
      modern: {
        heading: 'Montserrat, sans-serif',
        body: 'Open Sans, sans-serif',
        accent: 'Roboto, sans-serif',
      },
      traditional: {
        heading: 'Playfair Display, serif',
        body: 'Merriweather, serif',
        accent: 'Georgia, serif',
      },
      artistic: {
        heading: 'Abril Fatface, cursive',
        body: 'Lora, serif',
        accent: 'Dancing Script, cursive',
      },
      minimalist: {
        heading: 'Poppins, sans-serif',
        body: 'Work Sans, sans-serif',
        accent: 'Nunito, sans-serif',
      },
    };

    return fontSets[style] || fontSets.modern;
  }

  /**
   * Get border settings for style
   */
  private getBordersForStyle(style: string): Record<string, string> {
    const borderSets: Record<string, Record<string, string>> = {
      modern: {
        type: 'solid',
        width: '1px',
      },
      traditional: {
        type: 'double',
        width: '3px',
      },
      artistic: {
        type: 'dotted',
        width: '2px',
      },
      minimalist: {
        type: 'none',
        width: '0',
      },
    };

    return borderSets[style] || borderSets.modern;
  }

  /**
   * Get accent settings for style
   */
  private getAccentsForStyle(style: string): Record<string, boolean> {
    const accentSets: Record<string, Record<string, boolean>> = {
      modern: {
        useIcons: true,
        useAnimations: true,
        useShadows: true,
      },
      traditional: {
        useIcons: false,
        useAnimations: false,
        useShadows: true,
      },
      artistic: {
        useIcons: true,
        useAnimations: true,
        useShadows: false,
      },
      minimalist: {
        useIcons: true,
        useAnimations: false,
        useShadows: false,
      },
    };

    return accentSets[style] || accentSets.modern;
  }

  /**
   * Get sections for layout
   */
  private getSectionsForLayout(layout: string): string[] {
    const layoutSections: Record<string, string[]> = {
      standard: ['header', 'about', 'gallery', 'products', 'contact'],
      portfolio: ['hero', 'about', 'featured', 'gallery', 'testimonials', 'contact'],
      storefront: ['header', 'featured', 'categories', 'products', 'about', 'contact'],
      blog: ['header', 'about', 'posts', 'gallery', 'contact'],
    };

    return layoutSections[layout] || layoutSections.standard;
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
          const updatedRequest = await this.upgradeRequestRepository.updateUpgradeRequest(
            existingRequest.id,
            {
              ...data,
              status: UpgradeRequestStatus.PENDING,
              adminNotes: null,
            },
          );

          this.logger.info(`Upgrade request updated for user ${userId}`);

          return updatedRequest;
        }
      }

      // Create new upgrade request
      const newRequest = await this.upgradeRequestRepository.createUpgradeRequest(userId, data);

      this.logger.info(`New upgrade request created for user ${userId}`);

      return newRequest;
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
      const updatedRequest = await this.upgradeRequestRepository.approveRequest(
        requestId,
        adminNotes,
      );

      this.logger.info(`Upgrade request ${requestId} approved for user ${request.userId}`);

      return updatedRequest;
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
      const updatedRequest = await this.upgradeRequestRepository.rejectRequest(
        requestId,
        adminNotes,
      );

      this.logger.info(`Upgrade request ${requestId} rejected for user ${request.userId}`);

      return updatedRequest;
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

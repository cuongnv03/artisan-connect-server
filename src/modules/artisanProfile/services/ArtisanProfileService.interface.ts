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
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { UserWithArtisanProfile } from '../../../modules/user';

export interface IArtisanProfileService {
  /**
   * Create artisan profile
   */
  createArtisanProfile(
    userId: string,
    data: CreateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser>;

  /**
   * Update artisan profile
   */
  updateArtisanProfile(
    userId: string,
    data: UpdateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser>;

  /**
   * Get artisan profiles with pagination
   */
  getArtisanProfilesWithPagination(
    page?: number,
    limit?: number,
    filters?: Record<string, any>,
  ): Promise<PaginatedResult<UserWithArtisanProfile>>;

  /**
   * Get artisan profile by ID
   */
  getArtisanProfileById(id: string): Promise<ArtisanProfileWithUser | null>;

  /**
   * Get artisan profile by user ID
   */
  getArtisanProfileByUserId(userId: string): Promise<ArtisanProfileWithUser | null>;

  /**
   * Get current user's artisan profile
   */
  getMyArtisanProfile(userId: string): Promise<ArtisanProfileWithUser>;

  /**
   * Generate template using AI
   */
  generateTemplate(userId: string, data: GenerateTemplateDto): Promise<TemplateResult>;

  /**
   * Get default templates
   */
  getDefaultTemplates(): Promise<any[]>;

  /**
   * Request upgrade to artisan
   */
  requestUpgrade(userId: string, data: ArtisanUpgradeRequestDto): Promise<ArtisanUpgradeRequest>;

  /**
   * Get upgrade request status
   */
  getUpgradeRequestStatus(userId: string): Promise<any>;

  /**
   * Get all upgrade requests for admin
   */
  getUpgradeRequests(
    status?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>>;

  /**
   * Approve upgrade request (admin only)
   */
  approveUpgradeRequest(requestId: string, adminNotes?: string): Promise<ArtisanUpgradeRequest>;

  /**
   * Reject upgrade request (admin only)
   */
  rejectUpgradeRequest(requestId: string, adminNotes: string): Promise<ArtisanUpgradeRequest>;
}

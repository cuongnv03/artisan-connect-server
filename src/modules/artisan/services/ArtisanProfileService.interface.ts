import {
  ArtisanProfile,
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
  ArtisanSearchFilters,
  TemplateCustomizationDto,
  TemplateResult,
} from '../models/ArtisanProfile';
import {
  ArtisanUpgradeRequest,
  ArtisanUpgradeRequestWithUser,
  CreateUpgradeRequestDto,
} from '../models/ArtisanUpgradeRequest';
import { UpgradeRequestStatus } from '../models/ArtisanEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IArtisanProfileService {
  // Artisan Profile Management
  createArtisanProfile(
    userId: string,
    data: CreateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser>;
  updateArtisanProfile(
    userId: string,
    data: UpdateArtisanProfileDto,
  ): Promise<ArtisanProfileWithUser>;
  getArtisanProfileById(id: string): Promise<ArtisanProfileWithUser | null>;
  getArtisanProfileByUserId(userId: string): Promise<ArtisanProfileWithUser | null>;
  getMyArtisanProfile(userId: string): Promise<ArtisanProfileWithUser>;
  deleteArtisanProfile(userId: string): Promise<boolean>;

  // Artisan Discovery
  searchArtisans(
    filters: ArtisanSearchFilters,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<ArtisanProfileWithUser>>;
  getTopArtisans(limit?: number): Promise<ArtisanProfileWithUser[]>;
  getArtisansBySpecialty(specialty: string, limit?: number): Promise<ArtisanProfileWithUser[]>;
  getFeaturedArtisans(): Promise<ArtisanProfileWithUser[]>;

  // Template Management
  getAvailableTemplates(): Promise<any[]>;
  customizeTemplate(userId: string, data: TemplateCustomizationDto): Promise<TemplateResult>;
  getTemplatePreview(templateId: string, customData: any): Promise<string>;

  // Upgrade Request Management
  requestUpgrade(userId: string, data: CreateUpgradeRequestDto): Promise<ArtisanUpgradeRequest>;
  getUpgradeRequestStatus(userId: string): Promise<any>;
  updateUpgradeRequest(
    userId: string,
    data: CreateUpgradeRequestDto,
  ): Promise<ArtisanUpgradeRequest>;

  // Admin Functions
  getUpgradeRequests(
    status?: UpgradeRequestStatus,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<ArtisanUpgradeRequestWithUser>>;
  approveUpgradeRequest(
    requestId: string,
    adminId: string,
    adminNotes?: string,
  ): Promise<ArtisanUpgradeRequest>;
  rejectUpgradeRequest(
    requestId: string,
    adminId: string,
    adminNotes: string,
  ): Promise<ArtisanUpgradeRequest>;
  verifyArtisan(profileId: string, isVerified: boolean): Promise<ArtisanProfile>;

  // Analytics
  getArtisanStats(userId: string): Promise<any>;
  updateArtisanRating(profileId: string, newRating: number, reviewCount: number): Promise<void>;
}

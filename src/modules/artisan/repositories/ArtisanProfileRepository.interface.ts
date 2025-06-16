import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  ArtisanProfile,
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
  ArtisanSearchFilters,
} from '../models/ArtisanProfile';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IArtisanProfileRepository extends BaseRepository<ArtisanProfile, string> {
  findByUserId(userId: string): Promise<ArtisanProfileWithUser | null>;
  createProfile(userId: string, data: CreateArtisanProfileDto): Promise<ArtisanProfileWithUser>;
  updateProfile(userId: string, data: UpdateArtisanProfileDto): Promise<ArtisanProfileWithUser>;
  findByIdWithUser(id: string): Promise<ArtisanProfileWithUser | null>;
  searchArtisans(
    filters: ArtisanSearchFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ArtisanProfileWithUser>>;
  updateRating(profileId: string, newRating: number, reviewCount: number): Promise<void>;
  updateTotalSales(profileId: string, totalSales: number): Promise<void>;
  getTopArtisans(limit: number): Promise<ArtisanProfileWithUser[]>;
  getArtisansBySpecialty(specialty: string, limit: number): Promise<ArtisanProfileWithUser[]>;
  verifyArtisan(profileId: string, isVerified: boolean): Promise<ArtisanProfile>;
  getSuggestedArtisans(excludeUserIds: string[], limit: number): Promise<ArtisanProfileWithUser[]>;
}

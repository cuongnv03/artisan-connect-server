import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  ArtisanProfile,
  ArtisanProfileWithUser,
  CreateArtisanProfileDto,
  UpdateArtisanProfileDto,
} from '../models/ArtisanProfile';

export interface IArtisanProfileRepository extends BaseRepository<ArtisanProfile, string> {
  /**
   * Find profile by user ID
   */
  findByUserId(userId: string): Promise<ArtisanProfileWithUser | null>;

  /**
   * Create artisan profile
   */
  createProfile(userId: string, data: CreateArtisanProfileDto): Promise<ArtisanProfileWithUser>;

  /**
   * Update artisan profile
   */
  updateProfile(userId: string, data: UpdateArtisanProfileDto): Promise<ArtisanProfileWithUser>;

  findAllWithUsers(options?: Record<string, any>): Promise<ArtisanProfileWithUser[]>;

  /**
   * Find profile by ID with user details
   */
  findByIdWithUser(id: string): Promise<ArtisanProfileWithUser | null>;
}

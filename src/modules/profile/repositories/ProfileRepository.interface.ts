import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Profile, ProfileWithUser, UpdateProfileDto } from '../models/Profile';

export interface IProfileRepository extends BaseRepository<Profile, string> {
  /**
   * Find profile by user ID
   */
  findByUserId(userId: string): Promise<ProfileWithUser | null>;

  /**
   * Ensure a user has a profile, creating one if it doesn't exist
   */
  ensureProfile(userId: string): Promise<Profile>;

  /**
   * Update a profile
   */
  updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser>;
}
